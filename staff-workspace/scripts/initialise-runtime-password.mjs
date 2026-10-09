import {access,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {verifyRuntimeRole,runtimeRole} from '../lib/runtime-role-policy.mjs';
import {runtimePasswordVerifier,runtimeConnectionUrl} from '../lib/runtime-password.mjs';
import {privateTerminal} from '../lib/private-terminal.mjs';

// OWNER HANDOFF ONLY: an interactive command, not a build step or web route.
// Run it yourself; the assistant must not enter or submit a password for you.
const outputFile=new URL('../.env.runtime.local',import.meta.url);
let pool, reader, saved=false, committed=false, phase='check-local-settings';

try {
  if (!process.stdin.isTTY || !process.stdout.isTTY || process.env.VERCEL) {
    throw new Error('Run yourself in an interactive local terminal.');
  }
  try {await access(outputFile);throw new Error('Private runtime file already exists.');}
  catch(error) {if(error.code!=='ENOENT') throw error;}
  const config=databaseConfig({...process.env,DATABASE_URL:process.env.DATABASE_MIGRATION_URL});
  if(!config || !process.env.DATABASE_URL) throw new Error('Missing private local connections.');
  console.log('Initialise the password ONLY for jdpi_workspace_runtime in jdpi_staff.');
  console.log('No owner password, grants, staff records or Vercel settings will change.');
  phase='private-password-prompt';
  reader=privateTerminal();
  const consent=await reader.visible('Type INITIALISE to continue, or press Enter to cancel: ');
  if(consent!=='INITIALISE') {reader.close();console.log('Cancelled. No database or file changes.');process.exit(0);}
  const password=await reader.secret('New password (hidden; use 24–128 random characters from your password manager): ');
  const verifier=runtimePasswordVerifier(password);
  if(password!==await reader.secret('Enter the same password again (hidden): ')) throw new Error('Passwords did not match.');
  reader.close();reader=undefined;
  console.log('Password entries received. Checking the limited database role…');
  phase='connect-and-check-role';
  const runtimeUrl=runtimeConnectionUrl(process.env.DATABASE_URL,process.env.DATABASE_MIGRATION_URL,password);
  const runtimeConfig=databaseConfig({...process.env,DATABASE_URL:runtimeUrl});
  pool=new Pool(config);
  const db=await pool.connect();
  try {
    await db.query('BEGIN');
    if((await db.query('SELECT current_database() AS name')).rows[0].name!=='jdpi_staff') throw new Error('Wrong database.');
    if((await verifyRuntimeRole(db)).loginEnabled) throw new Error('Role already activated; do not silently rotate it.');
    // Create once, before activating: a disk-write failure cannot leave an
    // active credential with no recovery copy. Never overwrite user files.
    phase='save-private-connection';
    await writeFile(outputFile,`# PRIVATE. Never commit, share in chat or screenshot.\nDATABASE_URL=${runtimeUrl}\n`,{flag:'wx',mode:0o600});
    saved=true;
    if(!/^SCRAM-SHA-256\$4096:[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/.test(verifier)) throw new Error('Invalid verifier.');
    phase='activate-runtime-password';
    await db.query(`ALTER ROLE ${runtimeRole} LOGIN PASSWORD '${verifier}'`);
    if(!(await verifyRuntimeRole(db)).loginEnabled) throw new Error('Role not enabled.');
    await db.query('COMMIT'); committed=true;
  } catch(error) {await db.query('ROLLBACK');throw error;}
  finally {db.release();}
  phase='verify-runtime-connection';
  console.log('Password saved. Verifying the private runtime connection…');
  await pool.end(); pool=new Pool(runtimeConfig);
  const runtime=await pool.connect();
  try {
    await runtime.query('BEGIN');
    if((await runtime.query('SELECT current_user AS name')).rows[0].name!==runtimeRole) throw new Error('Unexpected runtime identity.');
    await verifyRuntimeRole(runtime);
    await runtime.query('SELECT id FROM public.workspace_control WHERE id=1 FOR UPDATE');
    await runtime.query('ROLLBACK');
  } finally {runtime.release();}
  console.log('Runtime password initialised; TLS login, limited privileges and row locking verified.');
  console.log('Private DATABASE_URL saved in:',fileURLToPath(outputFile));
  console.log('No secret is printed. Keep this file private; deployment credentials are still not uploaded.');
} catch {
  // Never print PostgreSQL errors, input passwords, verifiers or URLs.
  console.error(committed ? 'Password was saved and activated, but runtime verification failed. Keep the private file and report this status.' : 'Initialisation stopped; no password change committed.');
  if(saved && !committed) console.error('A private recovery file exists, but its password was NOT activated. Do not upload it; ask for the next safe step.');
  console.error('Stage:',phase);
  console.error('No credentials printed.');process.exitCode=1;
} finally {reader?.close();await pool?.end();}
