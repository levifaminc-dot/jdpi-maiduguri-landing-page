import 'server-only';
import {Pool} from 'pg';
import {databaseConfig} from './database-config.mjs';
/** @type {Pool | undefined} */
let pool;
export function getPool() {
  const settings=databaseConfig(process.env);
  if(!settings) return null;
  if(!pool) {
    pool=new Pool(settings);
    pool.on('error',()=>console.error('Workspace database connection unavailable.'));
  }
  return pool;
}
