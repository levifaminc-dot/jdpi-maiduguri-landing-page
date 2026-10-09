import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {getAuthTables} from '@better-auth/core/db';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
import {databaseConfig} from '../lib/database-config.mjs';
import {requestAccess,acceptInvitation,readMember,adminOverview,changeMember,bootstrapAdmin,validMemberChange} from '../lib/membership.mjs';
const person=n=>({tenantId:JDPI_TENANT_ID,objectId:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,name:`Fictional colleague ${n}`});
async function fixture() {
  const db=new PGlite();
  for(const name of ['000-auth.sql','001-membership.sql']) await db.exec(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'));
  const pool={query:(sql,params)=>db.query(sql,params),connect:async()=>({query:(sql,params)=>db.query(sql,params),release(){}})};
  async function authUser(identity) {await db.query(`INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt","tenantId","objectId") VALUES ($1,$2,$3,false,now(),now(),$4,$5)`,[identity.objectId,identity.name,`${identity.objectId}@test.invalid`,identity.tenantId,identity.objectId]);}
  async function admin() {const identity=person(1);await authUser(identity);await requestAccess(pool,identity);await bootstrapAdmin(pool,identity);return identity;}
  return {db,pool,authUser,admin};
}
test('Neon settings enforce certificate validation and reject URL overrides',()=>{
  const config=databaseConfig({DATABASE_URL:'postgresql://test:fictional@ep-test.neon.tech/database?sslmode=require&channel_binding=require'});
  assert.equal(config.ssl.rejectUnauthorized,true);assert(!config.connectionString.includes('sslmode'));
  assert.throws(()=>databaseConfig({DATABASE_URL:'postgres://test:fictional@unapproved.example/db'}));
  assert.throws(()=>databaseConfig({DATABASE_URL:'postgres://test:fictional@ep-test.neon.tech/db?sslcert=private-file'}));
  assert.throws(()=>databaseConfig({DATABASE_URL:'postgres://test:fictional@localhost/db',NODE_ENV:'production'}));
  assert.equal(databaseConfig({}),null);
});
test('SQL schema contains the pinned Better Auth fields and no required unwritten columns',async()=>{
  const {db}=await fixture();
  try {
    const tables=getAuthTables({rateLimit:{storage:'database'},user:{additionalFields:{tenantId:{type:'string',required:true},objectId:{type:'string',required:true}}}});
    for(const table of Object.values(tables)) {
      const columns=(await db.query('SELECT column_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2',['public',table.modelName])).rows;
      const names=columns.map(column=>column.column_name);
      for(const [name,field] of Object.entries(table.fields)) {assert(names.includes(field.fieldName || name),`${table.modelName}.${name}`);if(field.required) assert.equal(columns.find(c=>c.column_name===(field.fieldName||name)).is_nullable,'NO');}
      for(const column of columns) assert(column.column_name==='id'||Object.values(table.fields).some(f=>f.fieldName===column.column_name)||column.column_name in table.fields||column.is_nullable==='YES'||column.column_default);
    }
  }finally{await db.close();}
});
test('requests do not admit staff; explicit first admin requires verified pending identity and is one-time',async()=>{
  const {db,pool,authUser}=await fixture();
  try {
    const identity=person(1);await requestAccess(pool,identity);
    assert.equal((await readMember(pool,identity)).status,'PENDING');
    await assert.rejects(adminOverview(pool,identity),{status:403});
    await assert.rejects(bootstrapAdmin(pool,identity),{status:409});
    await authUser(identity);await bootstrapAdmin(pool,identity);
    assert.equal((await readMember(pool,identity)).role,'ADMIN');
    const other=person(2);await authUser(other);await requestAccess(pool,other);
    await assert.rejects(bootstrapAdmin(pool,other),{status:409});
    assert.equal((await readMember(pool,other)).status,'PENDING');
  }finally{await db.close();}
});
test('only database-active admins admit/invite; suspended users cannot re-request or elevate',async()=>{
  const {db,pool,admin}=await fixture();
  try {
    const leader=await admin(), staff=person(2);
    await requestAccess(pool,staff);
    await assert.rejects(changeMember(pool,{...staff,role:'ADMIN'},{action:'admit',objectId:staff.objectId}),{status:403});
    await changeMember(pool,leader,{action:'admit',objectId:staff.objectId});
    assert.equal((await readMember(pool,staff)).role,'STAFF');
    await assert.rejects(changeMember(pool,staff,{action:'invite',objectId:person(3).objectId,name:'Fictional'}),{status:403});
    await changeMember(pool,leader,{action:'suspend',objectId:staff.objectId});
    await requestAccess(pool,staff);assert.equal((await readMember(pool,staff)).status,'SUSPENDED');
    await assert.rejects(adminOverview(pool,staff),{status:403});
    await changeMember(pool,leader,{action:'restore',objectId:staff.objectId});assert.equal((await readMember(pool,staff)).role,'STAFF');
    const events=(await db.query('SELECT action FROM workspace_audit')).rows.map(x=>x.action);assert(events.includes('suspend'));assert(events.includes('admit'));
  }finally{await db.close();}
});
test('invitation is bound to the exact object ID, accepts as staff, cannot be replayed',async()=>{
  const {db,pool,admin}=await fixture();
  try {
    const leader=await admin(), invited=person(3);
    await changeMember(pool,leader,{action:'invite',objectId:invited.objectId,name:'Fictional invite'});
    await assert.rejects(acceptInvitation(pool,person(4)),{status:409});
    const result=await acceptInvitation(pool,invited);assert.equal(result.status,'ACTIVE');assert.equal(result.role,'STAFF');
    await assert.rejects(acceptInvitation(pool,invited),{status:409});
    await assert.rejects(changeMember(pool,leader,{action:'invite',objectId:invited.objectId,name:'Duplicate'}),{status:409});
    assert.equal(validMemberChange({action:'invite',objectId:person(5).objectId,name:'Fictional',role:'ADMIN'}),false);
  }finally{await db.close();}
});
test('last-admin protection and role/suspension revoke durable sessions atomically',async()=>{
  const {db,pool,admin,authUser}=await fixture();
  try {
    const leader=await admin(), colleague=person(2);await authUser(colleague);await requestAccess(pool,colleague);
    await assert.rejects(changeMember(pool,leader,{action:'role',objectId:leader.objectId,role:'STAFF'}),{status:409});
    await assert.rejects(changeMember(pool,leader,{action:'suspend',objectId:leader.objectId}),{status:409});
    await changeMember(pool,leader,{action:'admit',objectId:colleague.objectId});
    await db.query(`INSERT INTO "session"(id,"expiresAt",token,"createdAt","updatedAt","userId") VALUES ('fictional-session',now()+interval '15 minutes','fictional-token',now(),now(),$1)`,[colleague.objectId]);
    await changeMember(pool,leader,{action:'role',objectId:colleague.objectId,role:'ADMIN'});
    assert.equal((await db.query('SELECT count(*)::int AS count FROM "session"')).rows[0].count,0);
    await changeMember(pool,colleague,{action:'role',objectId:leader.objectId,role:'STAFF'});
    await assert.rejects(changeMember(pool,leader,{action:'suspend',objectId:colleague.objectId}),{status:403});
    await assert.rejects(changeMember(pool,colleague,{action:'suspend',objectId:colleague.objectId}),{status:409});
  }finally{await db.close();}
});
test('DB rejects cross-tenant membership, forged roles, and applies shared throttling',async()=>{
  const {db,pool}=await fixture();
  try {
    await assert.rejects(requestAccess(pool,{...person(8),tenantId:'00000000-0000-4000-8000-000000000000'}));
    assert.equal(validMemberChange({action:'role',objectId:person(8).objectId,role:'OWNER'}),false);
    for(let i=0;i<20;i++) await requestAccess(pool,person(8));
    await assert.rejects(requestAccess(pool,person(8)),{status:429});
    assert.equal((await db.query('SELECT count(*)::int AS count FROM workspace_audit')).rows[0].count,1);
  }finally{await db.close();}
});
