import {access,lstat,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {verifyRuntimeRole,runtimeRole} from '../lib/runtime-role-policy.mjs';
import {runtimePasswordProblem,runtimeActivationSql,runtimeConnectionUrl,runtimeRecovery} from '../lib/runtime-password.mjs';
import {privateTerminal} from '../lib/private-terminal.mjs';

// OWNER HANDOFF ONLY: an interactive command, not a build step or web route.
// Run it yourself; the assistant must not enter or submit a password for you.
const outputFile=new URL('../.env.runtime.local',import.meta.url);
const resume=process.argv.includes('--resume');
let pool, reader, saved=false, committed=false, phase='check-local-settings';

try {
  if (!process.stdin.isTTY || !process.stdout.isTTY || process.env.VERCEL) {
    throw new Error('Run yourself in an interactive local terminal.');
  }
  if(resume) {
    const info=await lstat(outputFile);
    if(!info.isFile() || info.isSymbolicLink() || info.size>4096) throw new Error('Unexpected recovery file.');
  } else {
    try {await access(outputFile);throw new Error('Private runtime file already exists.');}
    catch(error) {if(error.code!=='ENOENT') throw error;}
  }
  const config=databaseConfig({...process.env,DATABASE_URL:process.env.DATABASE_MIGRATION_URL});
  if(!config || (!resume && !process.env.DATABASE_URL)) throw new Error('Missing private local connections.');
  if(config.ssl?.rejectUnauthorized!==true) throw new Error('Activation requires verified hosted TLS.');
  console.log(resume ? 'Resume activation ONLY for jdpi_workspace_runtime using the existing private recovery file.' : 'Initialise the password ONLY for jdpi_workspace_runtime in jdpi_staff.');
  console.log('No owner password, grants, staff records or Vercel settings will change.');
  console.log('Neon requires the original password over verified TLS, not a precomputed hash.');
  console.log('It is sent only from this local command to Neon; never printed or placed in shell history.');
  phase='private-password-prompt';
  reader=privateTerminal();
  const word=resume ? 'RESUME' : 'INITIALISE';
  const consent=await reader.visible(`Type ${word} to continue, or press Enter to cancel: `);
  if(consent!==word) {reader.close();console.log('Cancelled. No database or file changes.');process.exit(0);}
  let password, recovery;
  if(resume) {
    phase='validate-private-recovery-file';
    recovery=runtimeRecovery(await readFile(outputFile,'utf8'),process.env.DATABASE_MIGRATION_URL);
    password=recovery.password;
  } else for (;;) {
    password=await reader.secret('New password (hidden; 24–128 characters, no spaces; Ctrl+C cancels): ');
    const problem=runtimePasswordProblem(password);
    if(problem) {console.log(problem);console.log('Please try again. No password has been saved or changed.');continue;}
    if(password!==await reader.secret('Enter the same password again (hidden): ')) {
      console.log('The two entries did not match. Please enter both again; nothing has been saved or changed.');continue;
    }
    break;
  }
  // Only the owner-run process handles this secret; no assistant-run activation.
  const activationSql=runtimeActivationSql(password);
  reader.close();reader=undefined;
  console.log(resume ? 'Private recovery file accepted. Checking the limited database role…' : 'Password entries received. Checking the limited database role…');
  phase='connect-and-check-role';
  const runtimeUrl=recovery?.connection || runtimeConnectionUrl(process.env.DATABASE_URL,process.env.DATABASE_MIGRATION_URL,password);
  const runtimeConfig=databaseConfig({...process.env,DATABASE_URL:runtimeUrl});
  pool=new Pool(config);
  const db=await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query("SELECT pg_advisory_xact_lock(hashtext('jdpi-runtime-credential-setup'))");
    if((await db.query('SELECT current_database() AS name')).rows[0].name!=='jdpi_staff') throw new Error('Wrong database.');
    const alreadyActive=(await verifyRuntimeRole(db)).loginEnabled;
    if(alreadyActive && !resume) throw new Error('Role already activated; do not silently rotate it.');
    // Create once, before activating: a disk-write failure cannot leave an
    // active credential with no recovery copy. Never overwrite user files.
    if(!resume) {
      phase='save-private-connection';
      await writeFile(outputFile,`# PRIVATE. Never commit, share in chat or screenshot.\nDATABASE_URL=${runtimeUrl}\n`,{flag:'wx',mode:0o600});
    }
    saved=true;
    phase='activate-runtime-password';
    if(!alreadyActive) await db.query(activationSql);
    else console.log('Role already active. Checking the saved connection without changing its password.');
    phase='verify-activated-privileges';
    if(!(await verifyRuntimeRole(db)).loginEnabled) throw new Error('Role not enabled.');
    phase='commit-activation';
    await db.query('COMMIT'); committed=true;
  } catch(error) {await db.query('ROLLBACK');throw error;}
  finally {db.release();}
  phase='verify-runtime-connection';
  console.log('Activation transaction completed. Verifying the private runtime connection…');
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
} catch(error) {
  // Never print PostgreSQL errors, input passwords, verifiers or URLs.
  console.error(committed ? 'Activation transaction completed, but runtime verification failed. Keep the private file and report this status.' : 'Activation did not finish. Do not assume the password is active.');
  if(saved && !committed) console.error('The private recovery file is preserved. Do not upload it until runtime login verification succeeds.');
  console.error('Stage:',phase);
  console.error('Error code:',/^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : 'LOCAL_POLICY_CHECK');
  console.error('No credentials printed.');process.exitCode=1;
} finally {reader?.close();await pool?.end();}
// Windows consoles can retain a stdin handle even after readline closes.
// Database/file work and pool shutdown are awaited before exiting the CLI.
process.exit(process.exitCode ?? 0);
