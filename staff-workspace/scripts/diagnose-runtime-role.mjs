import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {runtimeRole,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
import {runtimePasswordVerifier} from '../lib/runtime-password.mjs';

// Diagnostic transactions ALWAYS roll back. Use fictional input only; never
// read the saved runtime password or commit any role/credential change.
let pool;
try {
  const config=databaseConfig({...process.env,DATABASE_URL:process.env.DATABASE_MIGRATION_URL});
  if(!config) throw new Error('Missing operator connection.');
  pool=new Pool(config);
  const db=await pool.connect();
  try {
    if((await db.query('SELECT current_database() AS name')).rows[0].name!=='jdpi_staff') throw new Error('Unexpected database.');
    const status=await verifyRuntimeRole(db);
    console.log('Runtime login enabled:',status.loginEnabled);
    const authority=(await db.query(`SELECT r.rolcreaterole AS can_manage_roles,
      EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles target ON target.oid=m.roleid
        WHERE target.rolname=$1 AND m.member=r.oid AND m.admin_option) AS direct_admin_option
      FROM pg_roles r WHERE r.rolname=current_user`,[runtimeRole])).rows[0];
    console.log('Operator role-management checks:',JSON.stringify(authority));
    const probe=async(label,sql,verify=false)=>{
      await db.query('BEGIN');
      let phase='database-command';
      try {
        await db.query(sql);
        if(verify) {phase='post-command-policy-check';await verifyRuntimeRole(db);}
        console.log(label,': accepted inside rolled-back diagnostic transaction.');
      }
      catch(error) {
        const message=String(error.message || '').toLowerCase();
        const category=/encrypt|scram|hash/.test(message) ? 'ENCRYPTED_PASSWORD_POLICY'
          : /admin option|permission|privilege|superuser/.test(message) ? 'ROLE_PERMISSION'
          : /password/.test(message) ? 'PASSWORD_POLICY' : 'OTHER_DATABASE_POLICY';
        console.log(label,': rejected; phase:',phase,'code:',/^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : 'UNKNOWN','category:',category);
        if(phase==='post-command-policy-check') {
          const facts=(await db.query(`SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,
            (SELECT count(*)::int FROM pg_auth_members WHERE member=r.oid) AS memberships
            FROM pg_roles r WHERE rolname=$1`,[runtimeRole])).rows[0];
          console.log('Post-command role flags (no password):',JSON.stringify(facts));
        }
      } finally {await db.query('ROLLBACK');}
    };
    await probe('LOGIN attribute',`ALTER ROLE ${runtimeRole} LOGIN`);
    const fictional=runtimePasswordVerifier('Fictional-diagnostic-only-password-0001');
    await probe('SCRAM password verifier',`ALTER ROLE ${runtimeRole} PASSWORD '${fictional}'`);
    await probe('Combined activation plus effective privilege verification',`ALTER ROLE ${runtimeRole} LOGIN PASSWORD '${fictional}'`,true);
    console.log('Diagnostics complete. All changes rolled back. No private credentials read or printed.');
  } finally {db.release();}
} catch {console.error('Diagnostic connection/check failed. No database error text or credentials printed.');process.exitCode=1;}
finally {await pool?.end();}
