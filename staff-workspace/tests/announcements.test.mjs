import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
import {createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
import {announcementFeed,announcementDetail,changeAnnouncement,validAnnouncementAction} from '../lib/announcements.mjs';
import {boundedJson} from '../lib/private-json.mjs';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const person=n=>({tenantId:JDPI_TENANT_ID,objectId:id(n),name:`Fictional colleague ${n}`});
const leader=person(1),staff=person(2),other=person(3),pending=person(4),suspended=person(5);
const draft=(n=100)=>({action:'create',id:id(n),title:'Fictional team update',body:'Fictional test content only.',category:'General'});
async function fixture() {
  const db=new PGlite();
  for(const name of ['000-auth.sql','001-membership.sql','002-announcements.sql','003-documents.sql','004-document-storage.sql'])await db.exec(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'));
  await db.exec('CREATE TABLE workspace_migration(name text PRIMARY KEY)');
  for(const [identity,role,status] of [[leader,'ADMIN','ACTIVE'],[staff,'STAFF','ACTIVE'],[other,'STAFF','ACTIVE'],[pending,'STAFF','PENDING'],[suspended,'STAFF','SUSPENDED']])await db.query('INSERT INTO workspace_member(tenant_id,object_id,name,role,status) VALUES ($1,$2,$3,$4,$5)',[identity.tenantId,identity.objectId,identity.name,role,status]);
  await db.exec(createRuntimeRoleSql);await db.exec(runtimeGrantsSql((await db.query('SELECT current_database() AS name')).rows[0].name));
  await verifyRuntimeRole(db);await db.exec('SET ROLE jdpi_workspace_runtime');
  const pool={connect:async()=>({query:(sql,params)=>db.query(sql,params),release(){}})};
  return {db,pool};
}
test('active membership is checked for every announcement operation; claimed admin roles are ignored',async()=>{
  const {db,pool}=await fixture();
  try {
    for(const actor of [pending,suspended,person(6)]) {
      await assert.rejects(announcementFeed(pool,actor),{status:403});
      await assert.rejects(changeAnnouncement(pool,actor,draft()),{status:403});
    }
    await assert.rejects(announcementFeed(pool,{...staff,tenantId:id(9)}),{status:401});
    await changeAnnouncement(pool,leader,draft());
    await assert.rejects(changeAnnouncement(pool,{...staff,role:'ADMIN'},{action:'publish',id:id(100),version:1}),{status:403});
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[leader.objectId]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(changeAnnouncement(pool,leader,{action:'publish',id:id(100),version:1}),{status:403});
    assert.equal((await db.query('SELECT status FROM workspace_announcement')).rows[0].status,'DRAFT');
  } finally {await db.close();}
});
test('draft privacy, publication, conflict checks, pinning and archival work through the limited role',async()=>{
  const {db,pool}=await fixture();
  try {
    await changeAnnouncement(pool,leader,draft());
    await assert.rejects(changeAnnouncement(pool,leader,draft()),{status:409});
    assert.equal((await announcementFeed(pool,staff)).posts.length,0);
    await assert.rejects(announcementDetail(pool,staff,id(100)),{status:404});
    assert.equal((await announcementFeed(pool,staff,{status:'DRAFT'})).posts.length,0);
    assert.equal((await announcementFeed(pool,leader,{status:'DRAFT'})).posts.length,1);
    await changeAnnouncement(pool,leader,{action:'publish',id:id(100),version:1});
    assert.equal((await announcementFeed(pool,staff)).posts.length,1);
    await assert.rejects(changeAnnouncement(pool,leader,{action:'archive',id:id(100),version:1}),{status:409});
    await changeAnnouncement(pool,leader,{action:'pin',id:id(100),version:2,enabled:true});
    assert.equal((await announcementDetail(pool,staff,id(100))).post.pinned,true);
    assert.equal((await announcementFeed(pool,staff,{query:'%'})).posts.length,0);
    await changeAnnouncement(pool,leader,{action:'archive',id:id(100),version:3});
    await assert.rejects(announcementDetail(pool,staff,id(100)),{status:404});
    await changeAnnouncement(pool,leader,{action:'restore',id:id(100),version:4});
    assert.equal((await announcementDetail(pool,leader,id(100))).post.status,'DRAFT');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM workspace_announcement')).rows[0].n,1);
    assert(!(await db.query('SELECT details FROM workspace_audit')).rows.some(row=>JSON.stringify(row).includes('Fictional test content')));
  } finally {await db.close();}
});

test('all active staff can publish and manage their own updates; admins moderate but other staff cannot',async()=>{
  const {db,pool}=await fixture();
  try {
    await changeAnnouncement(pool,staff,draft());
    const privatePost=(await announcementDetail(pool,staff,id(100))).post;
    assert.equal(privatePost.canManage,true);assert.equal(privatePost.canPin,false);
    assert.equal((await announcementFeed(pool,staff,{status:'DRAFT'})).posts.length,1);
    assert.equal((await announcementFeed(pool,other,{status:'DRAFT'})).posts.length,0);
    await assert.rejects(announcementDetail(pool,other,id(100)),{status:404});
    for(const action of ['edit','publish','archive','restore','comments']) {
      const command={action,id:id(100),version:1,...(action==='edit'?{title:'Forged change',body:'Forged content',category:'General'}:{}),...(action==='comments'?{enabled:false}:{})};
      await assert.rejects(changeAnnouncement(pool,other,command),{status:403});
    }
    await changeAnnouncement(pool,staff,{action:'publish',id:id(100),version:1});
    assert.equal((await announcementDetail(pool,other,id(100))).post.canManage,false);
    await assert.rejects(changeAnnouncement(pool,{...staff,role:'ADMIN'},{action:'pin',id:id(100),version:2,enabled:true}),{status:403});
    await changeAnnouncement(pool,leader,{action:'pin',id:id(100),version:2,enabled:true});
    await changeAnnouncement(pool,staff,{action:'edit',id:id(100),version:3,title:'Staff update',body:'Edited own content',category:'Operations'});
    await changeAnnouncement(pool,leader,{action:'archive',id:id(100),version:4});
    assert.equal((await announcementFeed(pool,staff,{status:'ARCHIVED'})).posts.length,1);
    assert.equal((await announcementFeed(pool,other,{status:'ARCHIVED'})).posts.length,0);
    await assert.rejects(announcementDetail(pool,other,id(100)),{status:404});
    assert.equal((await announcementDetail(pool,staff,id(100))).post.canManage,false);
    await assert.rejects(changeAnnouncement(pool,staff,{action:'restore',id:id(100),version:5}),{status:403});
    await changeAnnouncement(pool,leader,{action:'restore',id:id(100),version:5});
    assert.equal((await announcementDetail(pool,staff,id(100))).post.status,'DRAFT');
    await changeAnnouncement(pool,staff,{action:'archive',id:id(100),version:6});
    await changeAnnouncement(pool,staff,{action:'restore',id:id(100),version:7});
    assert.equal((await announcementDetail(pool,staff,id(100))).post.canManage,true);
  } finally {await db.close();}
});
test('staff comment only on published open discussions; ownership and admin moderation are enforced',async()=>{
  const {db,pool}=await fixture();
  try {
    await changeAnnouncement(pool,leader,draft());
    const comment={action:'comment',id:id(200),announcementId:id(100),body:'Fictional comment.'};
    await assert.rejects(changeAnnouncement(pool,staff,comment),{status:409});
    await changeAnnouncement(pool,leader,{action:'publish',id:id(100),version:1});
    await changeAnnouncement(pool,staff,comment);
    await assert.rejects(changeAnnouncement(pool,staff,comment),{status:409});
    await assert.rejects(changeAnnouncement(pool,other,{action:'hide-comment',id:id(200)}),{status:403});
    const detail=await announcementDetail(pool,staff,id(100));assert.equal(detail.comments[0].canRemove,true);assert.equal(detail.post.commentCount,1);
    assert(!('author_object_id' in detail.comments[0]));
    await changeAnnouncement(pool,leader,{action:'hide-comment',id:id(200)});
    const moderated=await announcementDetail(pool,staff,id(100));assert.equal(moderated.comments[0].body,null);assert.equal(moderated.post.commentCount,0);
    assert.equal((await db.query('SELECT body FROM workspace_comment')).rows[0].body,'Fictional comment.');
    await changeAnnouncement(pool,leader,{action:'comments',id:id(100),version:2,enabled:false});
    await assert.rejects(changeAnnouncement(pool,staff,{...comment,id:id(201)}),{status:409});
    await db.exec('RESET ROLE');await db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[staff.objectId]);await db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(changeAnnouncement(pool,staff,{action:'hide-comment',id:id(200)}),{status:403});
    await assert.rejects(announcementDetail(pool,staff,id(100)),{status:403});
  } finally {await db.close();}
});
test('content validation rejects impersonation and runtime privileges deny destructive changes',async()=>{
  const {db,pool}=await fixture();
  try {
    for(const value of [{...draft(),author_object_id:staff.objectId},{...draft(),status:'PUBLISHED'},{...draft(),body:'x'.repeat(12001)},{...draft(),body:'bad\0body'},{action:'comment',id:id(200),announcementId:'invalid',body:'Fictional'}])assert.equal(validAnnouncementAction(value),false);
    await changeAnnouncement(pool,leader,{...draft(),title:'<script>fictional()</script>',body:"Fictional quote '; -- retained as text."});
    const post=(await announcementDetail(pool,leader,id(100))).post;
    assert.equal(post.title,'<script>fictional()</script>');
    await assert.rejects(db.exec('DELETE FROM workspace_announcement'));
    await assert.rejects(db.exec('TRUNCATE workspace_comment'));
    await assert.rejects(db.query('UPDATE workspace_announcement SET author_object_id=$1',[staff.objectId]));
    await assert.rejects(db.query('UPDATE workspace_comment SET body=$1',['Forged content']));
    await db.exec('RESET ROLE');await db.exec('GRANT UPDATE(body) ON workspace_comment TO jdpi_workspace_runtime');await assert.rejects(verifyRuntimeRole(db));
  } finally {await db.close();}
});
test('feeds are bounded and repeated writes are throttled across requests',async()=>{
  const {db,pool}=await fixture();
  try {
    for(let n=100;n<115;n++)await changeAnnouncement(pool,leader,draft(n));
    await assert.rejects(changeAnnouncement(pool,leader,draft(115)),{status:429});
    await assert.rejects(announcementFeed(pool,staff,{offset:-1}),{status:400});
    await db.exec('RESET ROLE');
    for(let n=300;n<325;n++)await db.query("INSERT INTO workspace_announcement(id,tenant_id,author_object_id,title,body,category,status,published_at) VALUES ($1,$2,$3,'Fictional update','Fictional content','General','PUBLISHED',now())",[id(n),JDPI_TENANT_ID,leader.objectId]);
    await db.exec('SET ROLE jdpi_workspace_runtime');
    const first=await announcementFeed(pool,staff);assert.equal(first.posts.length,20);assert.equal(first.hasMore,true);
    const second=await announcementFeed(pool,staff,{offset:20});assert.equal(second.posts.length,5);assert.equal(second.hasMore,false);
    assert(!first.posts.some(post=>second.posts.some(next=>post.id===next.id)));
  } finally {await db.close();}
});
test('JSON parsing bounds chunked bodies and route protections prevent public/cross-origin writes',async()=>{
  assert.deepEqual(await boundedJson(new Request('https://fictional.invalid',{method:'POST',body:'{"action":"test"}'})),{action:'test'});
  await assert.rejects(boundedJson(new Request('https://fictional.invalid',{method:'POST',body:'x'.repeat(100)}),50),{status:413});
  await assert.rejects(boundedJson(new Request('https://fictional.invalid',{method:'POST',body:'not-json'})),{status:400});
  const route=await readFile(new URL('../app/api/announcements/route.ts',import.meta.url),'utf8');
  assert.match(route,/workspaceIdentity\(request.headers\)/);assert.match(route,/get\('origin'\)!==config.origin/);assert.match(route,/boundedJson\(request\)/);assert.match(route,/private, no-store/);
  const component=await readFile(new URL('../components/Announcements.tsx',import.meta.url),'utf8');assert.doesNotMatch(component,/dangerouslySetInnerHTML/);
});
