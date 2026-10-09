import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {runtimeRole,createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';

// No credential creation or staff-data mutation. Password activation is an
// owner handoff after the limited permissions have been verified.
if (!process.argv.includes('--apply') && !process.argv.includes('--check')) {
  console.log('Plan only: create jdpi_workspace_runtime with NOLOGIN and limited explicit grants.');
  console.log('No password, database connection or staff changes. --apply requires explicit owner approval.');
  process.exit(0);
}
let pool, phase='connect';
try {
  const config = databaseConfig({...process.env, DATABASE_URL: process.env.DATABASE_MIGRATION_URL});
  if (!config) throw new Error('Missing approved operator connection.');
  pool = new Pool(config);
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query("SET LOCAL lock_timeout='5s'");
    const target = (await db.query('SELECT current_database() AS name')).rows[0].name;
    if (target !== 'jdpi_staff') throw new Error('Unexpected database target.');
    if (process.argv.includes('--apply')) {
      phase='check-existing-role';
      const existing = (await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[runtimeRole])).rows.length;
      if (existing) throw new Error('Role already exists; inspect rather than overwrite it.');
      phase='create-role';
      await db.query(createRuntimeRoleSql);
      phase='grant-runtime-privileges';
      await db.query(runtimeGrantsSql(target));
    }
    phase='verify-effective-privileges';
    const status = await verifyRuntimeRole(db);
    // PostgreSQL 18 does not automatically let a creator SET ROLE to a new
    // role. Do not widen operator role memberships merely for a test. Effective
    // SELECT/UPDATE(id) permissions are checked above; fixture tests exercise
    // the lock. Test a real runtime connection after owner credential handoff.
    await db.query(process.argv.includes('--apply') ? 'COMMIT' : 'ROLLBACK');
    console.log('Runtime role effective privileges verified, including required row-lock grants.');
    console.log(status.loginEnabled ? 'Role login is enabled; credentials are never printed.' : 'Role is NOLOGIN. The owner must privately activate its password before deployment.');
    console.log('No staff membership, session, audit, database owner or PUBLIC privileges changed.');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { db.release(); }
} catch (error) {
  // PostgreSQL messages may contain connection data or input; never print them.
  console.error('Runtime role setup/check failed; transaction rolled back. No credentials printed.');
  console.error('Error code:', /^[A-Z0-9]{5}$/.test(error.code || '') ? error.code : 'POLICY_CHECK');
  console.error('Stage:', phase);
  process.exitCode=1;
} finally { await pool?.end(); }
