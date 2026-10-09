import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {runtimeRole,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';

// Read-only diagnostic. Never read the saved runtime password or attempt a
// credential change. Rollback probes cannot test Neon's commit-time policy.
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
    console.log('Effective limited privileges verified. Read-only diagnostics complete. No private recovery credentials read or printed.');
  } finally {db.release();}
} catch {console.error('Diagnostic connection/check failed. No database error text or credentials printed.');process.exitCode=1;}
finally {await pool?.end();}
