// Read ONLY the explicitly approved fictional test's metadata and stored bytes.
import {Pool} from 'pg';
import {createHash} from 'node:crypto';
import {databaseConfig} from '../lib/database-config.mjs';
import {sharepointStorage} from '../lib/sharepoint-storage.mjs';
let pool;
try {
  pool=new Pool(databaseConfig(process.env));
  const row=(await pool.query('SELECT id,storage_provider,status,blob_path,sha256,byte_size FROM workspace_document WHERE title=$1 ORDER BY created_at DESC LIMIT 1',['TEST — not a JDPI policy (SharePoint verification)'])).rows[0];
  if(!row || row.storage_provider!=='sharepoint')throw new Error();
  console.log(JSON.stringify({id:row.id,provider:row.storage_provider,status:row.status,bytes:row.byte_size}));
  try {
    const bytes=await sharepointStorage().read(row.blob_path);
    const matches=createHash('sha256').update(bytes).digest('hex')===row.sha256 && bytes.length===row.byte_size;
    console.log('Fictional stored PDF matches its recorded checksum:',matches);
    if(!matches)process.exitCode=1;
  }catch(error){console.log('Fictional file read did not complete. HTTP status:',Number.isInteger(error?.status)?error.status:'not available');process.exitCode=1;}
}catch{console.error('Read-only fictional test verification failed. No credentials printed.');process.exitCode=1;}
finally{await pool?.end();}
