import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
import {createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
import {staffTagGrantsSql,verifyStaffTagGrants} from '../lib/staff-tag-grants.mjs';
import {documentAudienceGrantsSql,verifyDocumentAudienceGrants} from '../lib/document-audience-grants.mjs';
import {validDocumentAudience} from '../lib/document-audiences.mjs';
import {documentFeed,readDocumentFile,uploadDocument,changeDocument} from '../lib/documents.mjs';
import {readStaffTags,changeStaffTags} from '../lib/staff-tags.mjs';
import {staffDepartments,changeStaffDepartment} from '../lib/staff-departments.mjs';
import {announcementDetail} from '../lib/announcements.mjs';
import {documentPath} from '../lib/document-policy.mjs';
process.env.STAFF_TAGGING_ENABLED='true';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const person=n=>({tenantId:JDPI_TENANT_ID,objectId:id(n),name:`Fictional colleague ${n}`});
const admin=person(1),owner=person(2),tagged=person(3),department=person(4),other=person(5),editor=person(6),pending=person(7),suspended=person(8);
const bytes=new Uint8Array(100).fill(65),hash=createHash('sha256').update(bytes).digest('hex');
const sharing=(extra={})=>({kind:'document',id:id(100),version:1,sharingMode:'SELECTED',departments:[],staffIds:[],...extra});
async function fixture(){
  const db=new PGlite();
  for(const name of ['000-auth.sql','001-membership.sql','002-announcements.sql','003-documents.sql','004-document-storage.sql','005-staff-tags.sql'])await db.exec(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'));
  await db.exec('CREATE TABLE workspace_migration(name text PRIMARY KEY)');
  for(const actor of [admin,owner,tagged,department,other,editor,pending,suspended])await db.query('INSERT INTO workspace_member(tenant_id,object_id,name,role,status) VALUES ($1,$2,$3,$4,$5)',[actor.tenantId,actor.objectId,actor.name,actor===admin?'ADMIN':'STAFF',actor===pending?'PENDING':actor===suspended?'SUSPENDED':'ACTIVE']);
  // Seed an existing legacy PDF BEFORE adding audiences: migration must protect it.
  await db.query("INSERT INTO workspace_document(id,tenant_id,uploader_object_id,title,folder,filename,byte_size,page_count,sha256,blob_path,status) VALUES ($1,$2,$3,'Fictional private PDF','Other','fictional.pdf',100,2,$4,$5,'READY')",[id(100),JDPI_TENANT_ID,owner.objectId,hash,documentPath(JDPI_TENANT_ID,id(100))]);
  await db.exec(await readFile(new URL('../database/006-document-audiences.sql',import.meta.url),'utf8'));
  await db.query('INSERT INTO workspace_staff_profile(tenant_id,object_id,department,profile_editor) VALUES ($1,$2,$3,false)',[JDPI_TENANT_ID,department.objectId,'Nutrition']);
  await db.query('INSERT INTO workspace_staff_profile(tenant_id,object_id,department,profile_editor) VALUES ($1,$2,$3,true)',[JDPI_TENANT_ID,editor.objectId,'Programmes']);
  await db.query("INSERT INTO workspace_announcement(id,tenant_id,author_object_id,title,body,category) VALUES ($1,$2,$3,'Fictional draft','Fictional body','General')",[id(500),JDPI_TENANT_ID,owner.objectId]);
  await db.exec(createRuntimeRoleSql);await db.exec(runtimeGrantsSql((await db.query('SELECT current_database() AS name')).rows[0].name));await db.exec(staffTagGrantsSql);await db.exec(documentAudienceGrantsSql);await verifyRuntimeRole(db);await verifyStaffTagGrants(db);await verifyDocumentAudienceGrants(db);await db.exec('SET ROLE jdpi_workspace_runtime');
  let reads=0,puts=0;
  return {db,pool:{connect:async()=>({query:(sql,params)=>db.query(sql,params),release(){}})},storage:{put:async()=>{puts++;},read:async()=>{reads++;return bytes;}},counts:()=>({reads,puts})};
}
test('audience input requires explicit all-staff and bounds recipients/departments; announcement fields cannot carry file grants',()=>{
  assert(validDocumentAudience(sharing()));assert(validDocumentAudience(sharing({sharingMode:'ALL_STAFF'})));
  for(const extra of [{sharingMode:'PUBLIC'},{departments:['Unknown']},{departments:['Nutrition','Nutrition']},{departments:'Nutrition'},{staffIds:[id(3),id(3).toUpperCase()]},{staffIds:['invalid']},{sharingMode:'ALL_STAFF',staffIds:[id(3)]},{sharingMode:'ALL_STAFF',departments:['Nutrition']}])assert(!validDocumentAudience(sharing(extra)));
});
test('legacy PDFs default to uploader/admin-only; listings and tag/file APIs deny others before storage is contacted',async()=>{
  const {db,pool,storage,counts}=await fixture();try{
    for(const actor of [tagged,department,other,editor]){assert.equal((await documentFeed(pool,actor)).documents.length,0);await assert.rejects(readDocumentFile(pool,actor,id(100),storage),{status:404});await assert.rejects(readStaffTags(pool,actor,{kind:'document',id:id(100)}),{status:404});}
    assert.equal(counts().reads,0);assert.equal((await documentFeed(pool,owner)).documents.length,1);assert.equal((await documentFeed(pool,admin)).documents.length,1);
    await readDocumentFile(pool,owner,id(100),storage);await readDocumentFile(pool,admin,id(100),storage);assert.equal(counts().reads,2);
    for(const actor of [pending,suspended])await assert.rejects(readDocumentFile(pool,actor,id(100),storage),{status:403});
  }finally{await db.close();}
});
test('tags and approved departments grant read/download but not management; untagging and department changes revoke immediately',async()=>{
  const {db,pool,storage}=await fixture();try{
    await changeStaffTags(pool,owner,sharing({staffIds:[tagged.objectId],departments:['Nutrition']}));
    for(const actor of [tagged,department]){assert.equal((await documentFeed(pool,actor)).documents.length,1);await readDocumentFile(pool,actor,id(100),storage);assert.equal((await readStaffTags(pool,actor,{kind:'document',id:id(100)})).canManage,false);await assert.rejects(changeStaffTags(pool,actor,sharing({version:2})),{status:403});await assert.rejects(changeDocument(pool,actor,{action:'archive',id:id(100),version:2}),{status:403});}
    await assert.rejects(readDocumentFile(pool,other,id(100),storage),{status:404});
    await changeStaffDepartment(pool,editor,{id:department.objectId,version:1,department:'Finance'});await assert.rejects(readDocumentFile(pool,department,id(100),storage),{status:404});
    await changeStaffTags(pool,owner,sharing({version:2,departments:['Nutrition']}));await assert.rejects(readDocumentFile(pool,tagged,id(100),storage),{status:404});
    await changeStaffTags(pool,owner,sharing({version:3,sharingMode:'ALL_STAFF'}));for(const actor of [tagged,department,other])await readDocumentFile(pool,actor,id(100),storage);
    await changeStaffTags(pool,owner,sharing({version:4}));await assert.rejects(readDocumentFile(pool,other,id(100),storage),{status:404});
    await assert.rejects(changeStaffTags(pool,owner,sharing({version:4,staffIds:[other.objectId]})),{status:409});
    await assert.rejects(changeStaffTags(pool,owner,sharing({version:5,staffIds:[pending.objectId]})),{status:400});
  }finally{await db.close();}
});
test('suspension and archival override tags/all-staff; announcement drafts remain private',async()=>{
  const {db,pool,storage}=await fixture();try{
    await changeStaffTags(pool,owner,sharing({staffIds:[tagged.objectId]}));
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[tagged.objectId]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(readDocumentFile(pool,tagged,id(100),storage),{status:403});assert.equal((await readStaffTags(pool,owner,{kind:'document',id:id(100)})).tags.length,0);
    await changeStaffTags(pool,owner,sharing({version:2,sharingMode:'ALL_STAFF'}));await changeDocument(pool,owner,{action:'archive',id:id(100),version:3});
    await assert.rejects(readDocumentFile(pool,other,id(100),storage),{status:404});await readDocumentFile(pool,admin,id(100),storage);
    await changeStaffTags(pool,owner,{kind:'announcement',id:id(500),version:1,staffIds:[other.objectId]});await assert.rejects(announcementDetail(pool,other,id(500)),{status:404});
  }finally{await db.close();}
});
test('new uploads save audience before publication; no selection stays private; explicit all-staff works and retry audiences cannot overwrite',async()=>{
  const {db,pool,storage,counts}=await fixture();try{
    const metadata={id:id(200),title:'Fictional restricted PDF',description:'Fictional',folder:'Other',filename:'fictional.pdf',sharingMode:'SELECTED',departments:['Nutrition'],staffIds:[tagged.objectId]};
    await uploadDocument(pool,owner,metadata,bytes,storage,async()=>2);assert.equal(counts().puts,1);await readDocumentFile(pool,tagged,id(200),storage);await readDocumentFile(pool,department,id(200),storage);await assert.rejects(readDocumentFile(pool,other,id(200),storage),{status:404});
    await uploadDocument(pool,owner,metadata,bytes,storage,async()=>2);assert.equal(counts().puts,1);
    await assert.rejects(uploadDocument(pool,owner,{...metadata,staffIds:[other.objectId]},bytes,storage,async()=>2),{status:409});
    // Another actor has its own upload quota; no private audience implicitly becomes ALL_STAFF.
    const privateMeta={id:id(201),title:'Fictional owner-only PDF',description:'',folder:'Other',filename:'fictional.pdf'};await uploadDocument(pool,other,privateMeta,bytes,storage,async()=>2);await assert.rejects(readDocumentFile(pool,owner,id(201),storage),{status:404});
    await uploadDocument(pool,other,{...privateMeta,id:id(202),sharingMode:'ALL_STAFF',departments:[],staffIds:[]},bytes,storage,async()=>2);await readDocumentFile(pool,owner,id(202),storage);
    await assert.rejects(uploadDocument(pool,editor,{...privateMeta,id:id(203),sharingMode:'SELECTED',departments:[],staffIds:[pending.objectId]},bytes,storage,async()=>2),{status:400});assert.equal(counts().puts,3);
  }finally{await db.close();}
});
test('only admins/editors assign departments; staff cannot self-select a department or forge editor/admin status',async()=>{
  const {db,pool}=await fixture();try{
    assert.equal((await staffDepartments(pool,other)).canEdit,false);assert.equal((await staffDepartments(pool,editor)).canEdit,true);
    for(const actor of [other,{...other,role:'ADMIN',profileEditor:true}])await assert.rejects(changeStaffDepartment(pool,actor,{id:actor.objectId,version:0,department:'Nutrition'}),{status:403});
    await assert.rejects(changeStaffDepartment(pool,editor,{id:other.objectId,version:0,department:'Nutrition',profileEditor:true}),{status:403});
    await assert.rejects(changeStaffDepartment(pool,admin,{id:other.objectId,version:0,department:'Nutrition',role:'ADMIN'}),{status:400});
    await changeStaffDepartment(pool,admin,{id:other.objectId,version:0,department:'Nutrition',profileEditor:true});assert.equal((await staffDepartments(pool,other)).canAssignEditors,false);
    assert.equal((await db.query('SELECT role,status FROM workspace_member WHERE object_id=$1',[other.objectId])).rows[0].role,'STAFF');
    await assert.rejects(changeStaffDepartment(pool,admin,{id:other.objectId,version:0,department:'Finance'}),{status:409});
    await changeStaffDepartment(pool,admin,{id:other.objectId,version:1,department:'Nutrition',profileEditor:false});await assert.rejects(changeStaffDepartment(pool,other,{id:department.objectId,version:1,department:'Finance'}),{status:403});
    await assert.rejects(db.exec('DELETE FROM workspace_staff_profile'));await assert.rejects(db.query('UPDATE workspace_staff_profile SET object_id=$1',[id(99)]));
  }finally{await db.close();}
});
test('migration/grant plan is explicit; new routes bound requests and keep previews/private exports out of production',async()=>{
  for(const name of ['staff-tags','staff-departments']){const route=await readFile(new URL(`../app/api/${name}/route.ts`,import.meta.url),'utf8');for(const pattern of [/workspaceIdentity\(request.headers\)/,/STAFF_TAGGING_ENABLED!=='true'/,/boundedJson\(request,2048\)/,/private, no-store/])assert.match(route,pattern);}
  const migrate=await readFile(new URL('../scripts/migrate-database.mjs',import.meta.url),'utf8');assert(migrate.includes('006-document-audiences.sql'));assert(migrate.includes('verifyDocumentAudienceGrants'));
});
test('disabling the UI flag never widens migrated PDF listing or download access, and legacy-form uploads still default private',async()=>{
  const {db,pool,storage}=await fixture();try{
    process.env.STAFF_TAGGING_ENABLED='false';
    assert.equal((await documentFeed(pool,other)).documents.length,0);await assert.rejects(readDocumentFile(pool,other,id(100),storage),{status:404});
    const metadata={id:id(700),title:'Fictional legacy-form PDF',description:'',folder:'Other',filename:'fictional.pdf'};await uploadDocument(pool,owner,metadata,bytes,storage,async()=>2);
    assert.equal((await documentFeed(pool,other)).documents.length,0);await assert.rejects(readDocumentFile(pool,other,id(700),storage),{status:404});
    await readDocumentFile(pool,owner,id(700),storage);
    // Simulate a fictional partial tag-only installation, never live schema changes.
    await db.exec('RESET ROLE');await db.exec('ALTER TABLE workspace_document DROP COLUMN sharing_mode, DROP COLUMN sharing_departments');await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(readDocumentFile(pool,other,id(100),storage),{status:404});await assert.rejects(documentFeed(pool,other));
  }finally{process.env.STAFF_TAGGING_ENABLED='true';await db.close();}
});
