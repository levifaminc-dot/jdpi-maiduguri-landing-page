import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
import {createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
import {staffTagGrantsSql} from '../lib/staff-tag-grants.mjs';
import {documentAudienceGrantsSql,verifyDocumentAudienceGrants} from '../lib/document-audience-grants.mjs';
import {staffDirectoryGrantsSql,verifyStaffDirectoryGrants} from '../lib/staff-directory-grants.mjs';
import {staffDirectory,staffProfile,changeStaffProfile} from '../lib/staff-directory.mjs';
import {changeStaffDepartment} from '../lib/staff-departments.mjs';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const person=n=>({tenantId:JDPI_TENANT_ID,objectId:id(n),name:`Fictional colleague ${n}`});
const admin=person(1),owner=person(2),other=person(3),editor=person(4),pending=person(5),suspended=person(6),invited=person(7);
async function fixture(){
  const db=new PGlite();
  for(const file of ['000-auth.sql','001-membership.sql','002-announcements.sql','003-documents.sql','004-document-storage.sql','005-staff-tags.sql','006-document-audiences.sql','007-staff-directory.sql'])await db.exec(await readFile(new URL(`../database/${file}`,import.meta.url),'utf8'));
  await db.exec('CREATE TABLE workspace_migration(name text PRIMARY KEY)');
  for(const actor of [admin,owner,other,editor,pending,suspended,invited])await db.query('INSERT INTO workspace_member(tenant_id,object_id,name,role,status) VALUES ($1,$2,$3,$4,$5)',[actor.tenantId,actor.objectId,actor.name,actor===admin?'ADMIN':'STAFF',actor===pending?'PENDING':actor===suspended?'SUSPENDED':actor===invited?'INVITED':'ACTIVE']);
  await db.query("INSERT INTO workspace_staff_profile(tenant_id,object_id,department,profile_editor) VALUES ($1,$2,'Nutrition',true)",[JDPI_TENANT_ID,editor.objectId]);
  await db.exec(createRuntimeRoleSql);await db.exec(runtimeGrantsSql((await db.query('SELECT current_database() AS name')).rows[0].name));await db.exec(staffTagGrantsSql);await db.exec(documentAudienceGrantsSql);await db.exec(staffDirectoryGrantsSql);await verifyRuntimeRole(db);await verifyDocumentAudienceGrants(db);await verifyStaffDirectoryGrants(db);await db.exec('SET ROLE jdpi_workspace_runtime');
  return {db,pool:{connect:async()=>({query:(sql,params)=>db.query(sql,params),release(){}})}};
}
const change=(target,patch,version=0,privateVersion=0)=>({id:target.objectId,patch,version,privateVersion});
test('live directory includes only active approved members; owner-only fields never enter listings or other views',async()=>{
  const {db,pool}=await fixture();try{
    await changeStaffProfile(pool,owner,change(owner,{phone:'0000000000',homeAddress:'FICTIONAL PRIVATE ADDRESS',bio:'Fictional introduction'}));
    for(const viewer of [admin,owner,other,editor]){
      const data=await staffDirectory(pool,viewer);assert.equal(data.people.length,4);assert(!JSON.stringify(data).includes('FICTIONAL PRIVATE ADDRESS'));for(const profile of data.people){assert(!('phone' in profile));assert(!('homeAddress' in profile));assert(!('privateVersion' in profile));}
      const profile=await staffProfile(pool,viewer,owner.objectId);if(viewer===owner){assert.equal(profile.homeAddress,'FICTIONAL PRIVATE ADDRESS');assert.equal(profile.privateVersion,1);}else{assert(!('homeAddress' in profile));assert(!('phone' in profile));}
    }
    for(const actor of [pending,suspended,invited]){await assert.rejects(staffDirectory(pool,actor),{status:403});await assert.rejects(staffProfile(pool,actor,owner.objectId),{status:403});await assert.rejects(staffProfile(pool,owner,actor.objectId),{status:404});}
    const audits=await db.query('SELECT details FROM workspace_audit');assert(!JSON.stringify(audits.rows).includes('FICTIONAL PRIVATE ADDRESS'));
  }finally{await db.close();}
});
test('server resolves editor/admin capability; cross-user private writes and authority injection fail atomically',async()=>{
  const {db,pool}=await fixture();try{
    for(const actor of [owner,{...owner,role:'ADMIN',profileEditor:true}])await assert.rejects(changeStaffProfile(pool,actor,change(owner,{department:'Finance'})),{status:403});
    for(const actor of [other,editor,admin])await assert.rejects(changeStaffProfile(pool,actor,change(owner,{homeAddress:'Forbidden'})),{status:403});
    for(const patch of [{profileEditor:true},{role:'ADMIN'},{status:'ACTIVE'},{objectId:other.objectId},{phoneShared:true},{phone:'invalid'},{homeAddress:'x'.repeat(501)}])await assert.rejects(changeStaffProfile(pool,owner,change(owner,patch)));
    await assert.rejects(changeStaffProfile(pool,owner,{...change(owner,{bio:'Valid'}),profileEditor:true}),{status:400});
    await assert.rejects(changeStaffProfile(pool,admin,change(owner,{email:'outside@example.invalid'})),{status:400});
    await assert.rejects(changeStaffProfile(pool,admin,change(owner,{department:'Unapproved team'})),{status:400});
    const profile=await staffProfile(pool,owner,owner.objectId);assert.equal(profile.bio,'');assert.equal(profile.version,0);
    await changeStaffProfile(pool,editor,change(owner,{title:'Field officer',email:'fictional@jdpimaiduguri.org',office:'Mubi',state:'Adamawa',department:'FSL'}));
    assert.equal((await staffProfile(pool,other,owner.objectId)).department,'Food Security & Livelihoods');
    assert.equal((await db.query('SELECT role,status FROM workspace_member WHERE object_id=$1',[owner.objectId])).rows[0].role,'STAFF');
    await assert.rejects(changeStaffDepartment(pool,editor,{id:owner.objectId,version:1,department:'Nutrition',profileEditor:true}),{status:403});
  }finally{await db.close();}
});
test('independent versions reject lost updates; department/editor changes and suspension invalidate later writes',async()=>{
  const {db,pool}=await fixture();try{
    await changeStaffProfile(pool,owner,change(owner,{phone:'0000000000'}));
    await assert.rejects(changeStaffProfile(pool,owner,change(owner,{phone:'0000000001'})),{status:409});
    await changeStaffProfile(pool,admin,change(owner,{title:'Fictional officer'}));
    await assert.rejects(changeStaffProfile(pool,editor,change(owner,{title:'Stale'})),{status:409});
    // Clearing optional private values is supported without changing work details.
    await changeStaffProfile(pool,owner,change(owner,{phone:'',homeAddress:''},1,1));assert.equal((await staffProfile(pool,owner,owner.objectId)).phone,'');
    await changeStaffDepartment(pool,admin,{id:editor.objectId,version:1,department:'Nutrition',profileEditor:false});
    await assert.rejects(changeStaffProfile(pool,editor,change(owner,{title:'Revoked'},1)),{status:403});
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[owner.objectId]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(changeStaffProfile(pool,owner,change(owner,{bio:'Suspended'},1,2)),{status:403});assert.equal((await staffDirectory(pool,other)).people.length,3);await assert.rejects(staffProfile(pool,admin,owner.objectId),{status:404});
    await assert.rejects(db.exec('DELETE FROM workspace_staff_private_profile'));await assert.rejects(db.query('UPDATE workspace_staff_private_profile SET object_id=$1',[other.objectId]));
  }finally{await db.close();}
});
test('rate limit, private API boundary, explicit migration and local-only export guards remain enforced',async()=>{
  const {db,pool}=await fixture();try{
    for(let i=0;i<20;i++)await changeStaffProfile(pool,owner,change(owner,{phone:'0000000000'},0,i));
    await assert.rejects(changeStaffProfile(pool,owner,change(owner,{phone:'0000000001'},0,20)),{status:429});assert.equal((await staffProfile(pool,owner,owner.objectId)).privateVersion,20);
    const route=await readFile(new URL('../app/api/staff-directory/route.ts',import.meta.url),'utf8');for(const pattern of [/workspaceIdentity\(request.headers\)/,/boundedJson\(request,4096\)/,/private, no-store/,/request.headers.get\('origin'\)!==config.origin/])assert.match(route,pattern);
    const source=await readFile(new URL('../lib/staff-directory.mjs',import.meta.url),'utf8');assert(!source.includes('STAFF_DIRECTORY_PREVIEW_CSV'));assert(!source.includes('parseDirectoryCsv'));
    const migrate=await readFile(new URL('../scripts/migrate-database.mjs',import.meta.url),'utf8');assert(migrate.includes('007-staff-directory.sql'));assert(migrate.includes('verifyStaffDirectoryGrants'));
  }finally{await db.close();}
});
