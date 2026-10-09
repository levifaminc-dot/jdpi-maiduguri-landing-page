import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {runtimeRole,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';

// Operator-run, read-only smoke check. Counts only: never names, IDs or content.
let pool;
try {
  const config=databaseConfig(process.env);
  if(!config) throw new Error('Runtime settings required.');
  pool=new Pool(config);
  const db=await pool.connect();
  try {
    const connection=(await db.query('SELECT current_database() AS database,current_user AS role')).rows[0];
    if(connection.database!=='jdpi_staff' || connection.role!==runtimeRole) throw new Error('Expected limited runtime connection.');
    await verifyRuntimeRole(db);
    await db.query('BEGIN READ ONLY');
    try {
      const counts=(await db.query(`SELECT
        (SELECT count(*)::int FROM workspace_announcement) AS announcements,
        (SELECT count(*)::int FROM workspace_comment) AS comments,
        (SELECT count(*)::int FROM workspace_member) AS members`)).rows[0];
      console.log('Verified TLS runtime connection and limited announcement privileges.');
      console.log('Read-only counts:',JSON.stringify(counts));
    } finally {await db.query('ROLLBACK');}
  } finally {db.release();}
} catch {console.error('Announcement smoke check failed. No connection details or private content printed.');process.exitCode=1;}
finally {await pool?.end();}
