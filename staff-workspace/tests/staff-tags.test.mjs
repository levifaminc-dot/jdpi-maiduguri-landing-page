import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
import {createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
import {staffTagGrantsSql,verifyStaffTagGrants} from '../lib/staff-tag-grants.mjs';
import {validTagAction,eligibleTagStaff,readStaffTags,changeStaffTags} from '../lib/staff-tags.mjs';
import {announcementDetail} from '../lib/announcements.mjs';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const person=n=>({tenantId:JDPI_TENANT_ID,objectId:id(n),name:`Fictional colleague ${n}`});
const admin=person(1),owner=person(2),other=person(3),pending=person(4),suspended=person(5);
const command=(extra={})=>({kind:'announcement',id:id(100),version:1,staffIds:[other.objectId],...extra});
async function fixture(){
  const db=new PGlite();
  for(const name of ['000-auth.sql','001-membership.sql','002-announcements.sql','003-documents.sql','004-document-storage.sql','005-staff-tags.sql'])await db.exec(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'));
  await db.exec('CREATE TABLE workspace_migration(name text PRIMARY KEY)');
  for(const [identity,role,status] of [[admin,'ADMIN','ACTIVE'],[owner,'STAFF','ACTIVE'],[other,'STAFF','ACTIVE'],[pending,'STAFF','PENDING'],[suspended,'STAFF','SUSPENDED']])await db.query('INSERT INTO workspace_member(tenant_id,object_id,name,role,status) VALUES ($1,$2,$3,$4,$5)',[identity.tenantId,identity.objectId,identity.name,role,status]);
  await db.query("INSERT INTO workspace_announcement(id,tenant_id,author_object_id,title,body,category) VALUES ($1,$2,$3,'Fictional update','Fictional body','General')",[id(100),JDPI_TENANT_ID,owner.objectId]);
  await db.query("INSERT INTO workspace_document(id,tenant_id,uploader_object_id,title,folder,filename,byte_size,page_count,sha256,blob_path,status) VALUES ($1,$2,$3,'Fictional PDF','Other','fictional.pdf',100,2,$4,'fictional-path','READY')",[id(200),JDPI_TENANT_ID,owner.objectId,'0'.repeat(64)]);
  await db.exec(createRuntimeRoleSql);await db.exec(runtimeGrantsSql((await db.query('SELECT current_database() AS name')).rows[0].name));await db.exec(staffTagGrantsSql);await verifyRuntimeRole(db);await verifyStaffTagGrants(db);await db.exec('SET ROLE jdpi_workspace_runtime');
  return {db,pool:{connect:async()=>({query:(sql,params)=>db.query(sql,params),release(){}})}};
}
test('tag input rejects duplicate/case variants, forged roles, unbounded recipients and resource-type SQL injection',()=>{
  assert(validTagAction(command()));assert(validTagAction(command({staffIds:[]})));
  for(const extra of [{kind:'__proto__'},{kind:'workspace_member; DROP TABLE workspace_member'},{id:'not-uuid'},{version:0},{staffIds:null},{staffIds:[other.objectId,other.objectId.toUpperCase()]},{staffIds:Array.from({length:11},(_,n)=>id(n))},{staffIds:['not-uuid']},{role:'ADMIN'},{tenantId:JDPI_TENANT_ID},{authorObjectId:admin.objectId}])assert.equal(validTagAction(command(extra)),false);
});
test('only fresh active membership can select staff; picker returns no personal contact or role fields',async()=>{
  const {db,pool}=await fixture();try{
    const people=(await eligibleTagStaff(pool,owner)).people;assert.equal(people.length,3);for(const p of people)assert.deepEqual(Object.keys(p).sort(),['id','name']);
    for(const actor of [pending,suspended,person(6)])await assert.rejects(eligibleTagStaff(pool,actor),{status:403});
    await assert.rejects(eligibleTagStaff(pool,{...owner,tenantId:id(8)}),{status:401});
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[owner.objectId]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(changeStaffTags(pool,owner,command()),{status:403});
  }finally{await db.close();}
});
test('tags on a draft do not allow a tagged colleague to read it or take control; publication/archival rules remain',async()=>{
  const {db,pool}=await fixture();try{
    assert.equal((await changeStaffTags(pool,owner,command())).version,2);
    await assert.rejects(readStaffTags(pool,other,{kind:'announcement',id:id(100)}),{status:404});
    await assert.rejects(announcementDetail(pool,other,id(100)),{status:404});
    await assert.rejects(changeStaffTags(pool,{...other,role:'ADMIN'},command({version:2})),{status:404});
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_announcement SET status='PUBLISHED' WHERE id=$1",[id(100)]);await db.exec('SET ROLE jdpi_workspace_runtime');
    const viewed=await readStaffTags(pool,other,{kind:'announcement',id:id(100)});assert.equal(viewed.tags[0].name,other.name);assert.equal(viewed.canManage,false);
    await assert.rejects(changeStaffTags(pool,other,command({version:2})),{status:403});
    await assert.rejects(changeStaffTags(pool,owner,command()),{status:409});
    await changeStaffTags(pool,admin,command({version:2,staffIds:[]}));assert.equal((await readStaffTags(pool,owner,{kind:'announcement',id:id(100)})).tags.length,0);
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_announcement SET status='ARCHIVED',moderated=true WHERE id=$1",[id(100)]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(readStaffTags(pool,other,{kind:'announcement',id:id(100)}),{status:404});
    assert.equal((await readStaffTags(pool,owner,{kind:'announcement',id:id(100)})).canManage,false);
    await assert.rejects(changeStaffTags(pool,owner,command({version:3})),{status:403});
  }finally{await db.close();}
});
test('document tags require uploader/admin; suspended recipients are hidden and cannot be added; invalid updates roll back',async()=>{
  const {db,pool}=await fixture();try{
    const body=command({kind:'document',id:id(200)});await changeStaffTags(pool,owner,body);
    assert.equal((await readStaffTags(pool,other,{kind:'document',id:id(200)})).tags.length,1);
    await assert.rejects(changeStaffTags(pool,other,{...body,version:2}),{status:403});
    for(const staffId of [pending.objectId,suspended.objectId,id(50)])await assert.rejects(changeStaffTags(pool,owner,{...body,version:2,staffIds:[staffId]}),{status:400});
    assert.equal((await readStaffTags(pool,owner,{kind:'document',id:id(200)})).version,2);
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[other.objectId]);await db.exec('SET ROLE jdpi_workspace_runtime');
    assert.equal((await readStaffTags(pool,owner,{kind:'document',id:id(200)})).tags.length,0);
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_document SET status='ARCHIVED',moderated=true WHERE id=$1",[id(200)]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(changeStaffTags(pool,owner,{...body,version:2,staffIds:[]}),{status:403});
    const archived=await readStaffTags(pool,admin,{kind:'document',id:id(200)});assert.equal(archived.canManage,false);
    assert(!(await db.query('SELECT details FROM workspace_audit')).rows.some(row=>JSON.stringify(row).includes('Fictional')));
  }finally{await db.close();}
});
test('limited runtime can replace tags but cannot mutate audit history, members, resource ownership or tag timestamps',async()=>{
  const {db,pool}=await fixture();try{
    await changeStaffTags(pool,owner,command());
    for(const sql of ['TRUNCATE workspace_announcement_tag','UPDATE workspace_announcement_tag SET created_at=now()','DELETE FROM workspace_member','UPDATE workspace_audit SET action=\'forged\'','DELETE FROM workspace_audit'])await assert.rejects(db.exec(sql));
    await assert.rejects(db.query('UPDATE workspace_announcement SET author_object_id=$1',[other.objectId]));
    await db.exec('RESET ROLE');await db.exec('GRANT UPDATE(created_at) ON workspace_document_tag TO jdpi_workspace_runtime');await assert.rejects(verifyStaffTagGrants(db));
  }finally{await db.close();}
});
test('repeated tag writes are throttled and routes remain disabled until an explicit activation',async()=>{
  const {db,pool}=await fixture();try{
    for(let version=1;version<=20;version++)await changeStaffTags(pool,owner,command({version}));
    await assert.rejects(changeStaffTags(pool,owner,command({version:21})),{status:429});assert.equal((await readStaffTags(pool,owner,{kind:'announcement',id:id(100)})).version,21);
    const route=await readFile(new URL('../app/api/staff-tags/route.ts',import.meta.url),'utf8');for(const pattern of [/workspaceIdentity\(request.headers\)/,/STAFF_TAGGING_ENABLED!=='true'/,/get\('origin'\)!==config.origin/,/boundedJson\(request,2048\)/,/private, no-store/])assert.match(route,pattern);
  }finally{await db.close();}
});
