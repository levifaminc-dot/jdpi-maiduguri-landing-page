import {Pool} from 'pg';
import {databaseConfig} from '../lib/database-config.mjs';
import {JDPI_TENANT_ID,verifiedIdentity} from '../lib/microsoft-policy.mjs';
import {bootstrapAdmin} from '../lib/membership.mjs';
const objectId=process.argv.find(arg=>arg.startsWith('--object-id='))?.slice('--object-id='.length).toLowerCase();
const identity={tenantId:JDPI_TENANT_ID,objectId};
if(!verifiedIdentity(identity)) {console.error('Supply the approved Microsoft user object ID.');process.exit(1);}
if(!process.argv.includes('--apply')) {console.log('Plan only. First admin must have a verified login and pending request. No database connection or role grant.');process.exit(0);}
if(!process.argv.includes(`--confirm-admin=${objectId}`)) {console.error('Explicit confirmation of the same immutable identity is required.');process.exit(1);}
let pool;
try {
  const settings=databaseConfig({...process.env,DATABASE_URL:process.env.DATABASE_MIGRATION_URL,NODE_ENV:process.env.NODE_ENV || 'development'});
  if(!settings) throw new Error('Connection missing.');
  pool=new Pool(settings);await bootstrapAdmin(pool,identity);console.log('First-admin bootstrap recorded. Sign in again.');
} catch {console.error('Bootstrap not completed. Check pending identity, existing admin and private database settings.');process.exitCode=1;}
finally {await pool?.end();}
