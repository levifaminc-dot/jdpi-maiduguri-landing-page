import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {runtimeRole,announcementGrantsSql,documentGrantsSql,documentStorageGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
const files=['000-auth.sql','001-membership.sql','002-announcements.sql','003-documents.sql','004-document-storage.sql'];
const migrations=await Promise.all(files.map(async name=>{const sql=(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8')).replace(/\r\n/g,'\n');return {name,sql,hash:createHash('sha256').update(sql).digest('hex')};}));
if(!process.argv.includes('--apply')) {
  console.log('Plan only: existing migrations, plus additive immutable document-provider routing.');
  console.log('Only new content-table privileges are added to an existing limited runtime role. No staff rows or old grants change.');
  console.log('No database connection or writes. Prepared migration files:', files.join(', '));
  process.exit(0);
}
let pool;
try {
  const config=databaseConfig({...process.env,DATABASE_URL:process.env.DATABASE_MIGRATION_URL,NODE_ENV:process.env.NODE_ENV || 'development'});
  if(!config) throw new Error('Missing direct migration connection.');
  pool=new Pool(config);
  const db=await pool.connect();
  try {
    await db.query('BEGIN');
    if((await db.query('SELECT current_database() AS name')).rows[0].name!=='jdpi_staff') throw new Error('Unexpected database.');
    await db.query('CREATE TABLE IF NOT EXISTS workspace_migration(name text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    await db.query('LOCK TABLE workspace_migration IN EXCLUSIVE MODE');
    for(const migration of migrations) {
      const current=(await db.query('SELECT hash FROM workspace_migration WHERE name=$1',[migration.name])).rows[0];
      if(current) {if(current.hash!==migration.hash) throw new Error('Applied migration has changed.'); continue;}
      await db.query(migration.sql);
      if(migration.name==='002-announcements.sql' && (await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[runtimeRole])).rows.length) {
        await db.query(announcementGrantsSql);
      }
      if(migration.name==='003-documents.sql' && (await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[runtimeRole])).rows.length)await db.query(documentGrantsSql);
      if(migration.name==='004-document-storage.sql' && (await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[runtimeRole])).rows.length)await db.query(documentStorageGrantsSql);
      await db.query('INSERT INTO workspace_migration(name,hash) VALUES ($1,$2)',[migration.name,migration.hash]);
    }
    if((await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[runtimeRole])).rows.length)await verifyRuntimeRole(db);
    await db.query('COMMIT'); console.log('Database migrations applied. No memberships or admin roles created.');
  } catch(error) {await db.query('ROLLBACK');throw error;} finally {db.release();}
} catch {console.error('Migration failed. Check private connection settings and database permissions. No credentials are printed.');process.exitCode=1;}
finally {await pool?.end();}
