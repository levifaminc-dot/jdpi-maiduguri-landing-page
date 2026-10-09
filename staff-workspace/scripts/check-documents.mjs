import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {runtimeRole,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
// Read-only, counts only. Never emit document titles, names, IDs or credentials.
let pool;
try {
  const config=databaseConfig(process.env);if(!config)throw new Error();pool=new Pool(config);const db=await pool.connect();
  try {
    const connection=(await db.query('SELECT current_database() AS database,current_user AS role')).rows[0];
    if(connection.database!=='jdpi_staff' || connection.role!==runtimeRole)throw new Error();
    await verifyRuntimeRole(db);await db.query('BEGIN READ ONLY');
    try {
      const counts=(await db.query(`SELECT (SELECT count(*)::int FROM workspace_document) AS documents,
        (SELECT count(*)::int FROM workspace_document WHERE status='READY') AS shared,
        (SELECT count(*)::int FROM workspace_document WHERE status='ARCHIVED') AS archived,
        (SELECT reserved_bytes::text FROM workspace_document_control WHERE id=1) AS reservedBytes,
        (SELECT count(*)::int FROM workspace_member) AS members`)).rows[0];
      console.log('Verified TLS runtime connection and limited document privileges.');console.log('Read-only counts:',JSON.stringify(counts));
    }finally{await db.query('ROLLBACK');}
  }finally{db.release();}
}catch{console.error('Document smoke check failed. No private content or credentials printed.');process.exitCode=1;}
finally{await pool?.end();}
