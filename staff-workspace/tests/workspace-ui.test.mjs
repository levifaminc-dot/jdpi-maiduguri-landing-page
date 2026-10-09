import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {memberCounts,filterMembers,workspaceNavigation,invitationOrigin,invitationDraft,accessEventLabel} from '../lib/workspace-ui.mjs';
const members=[{name:'Ada Test',status:'ACTIVE',role:'ADMIN'},{name:'Binta Test',status:'PENDING',role:'STAFF'},
  {name:'Chidi Test',status:'ACTIVE',role:'STAFF'},{name:'Daniel Test',status:'SUSPENDED',role:'ADMIN'}];
test('dashboard counts and search/filter use membership statuses, not claimed roles',()=>{
  assert.deepEqual(memberCounts(members),{active:2,pending:1,suspended:1,admins:1});
  assert.deepEqual(filterMembers(members,'PENDING',' bINTA '),[members[1]]);
  assert.equal(filterMembers(members,'ACTIVE','Daniel').length,0);
  assert.equal(filterMembers(members,'ALL','Test').length,4);
});
test('staff navigation has no administration routes; admin has separate pages',()=>{
  assert.deepEqual(workspaceNavigation('STAFF').map(m=>m.href),['/workspace','/workspace/announcements']);
  assert.deepEqual(workspaceNavigation('ADMIN').map(m=>m.label),['Dashboard','Announcements','Members','Invitations','Settings']);
  assert.deepEqual(workspaceNavigation('anything').map(m=>m.href),['/workspace','/workspace/announcements']);
});
test('invitation drafts are messages, not invitations or automatic access grants',()=>{
  const result=invitationDraft('colleague@example.invalid','Test Colleague','https://staff.example.org');
  const parsed=new URL(result.mailto);
  assert.equal(decodeURIComponent(parsed.pathname),'colleague@example.invalid');
  assert.equal(parsed.searchParams.get('subject'),result.subject);
  assert.equal(parsed.searchParams.get('body'),result.body);
  assert.match(result.body,/Request workspace access/);
  assert.match(result.body,/does not grant access or an admin role/);
  assert.equal(result.local,false);
  assert.equal(invitationDraft('colleague@example.invalid','','http://localhost:4330').local,true);
  assert.throws(()=>invitationDraft('colleague@example.invalid\r\nBcc:someone@example.org','','https://staff.example.org'));
  assert.throws(()=>invitationDraft('one@example.org,two@example.org','','https://staff.example.org'));
});
test('invitation addresses cannot embed credentials or use unsafe protocols',()=>{
  for(const value of ['javascript:alert(1)','http://staff.example.org','https://user:secret@staff.example.org','https://staff.example.org/?token=x','https://staff.example.org/#secret','https://staff.example.org/unexpected']) assert.equal(invitationOrigin(value),null);
  assert.deepEqual(invitationOrigin('https://staff.example.org'),{url:'https://staff.example.org',local:false});
});
test('admin leaf routes verify fresh active membership, not layout or client role',async()=>{
  for(const page of ['members','invitations','settings']) {
    const text=await readFile(new URL(`../app/workspace/${page}/page.tsx`,import.meta.url),'utf8');
    assert.match(text,/await requireWorkspacePage\(true\)/);
  }
  const dal=await readFile(new URL('../lib/workspace-page.ts',import.meta.url),'utf8');
  assert.match(dal,/requireActiveMember\(await headers\(\)\)/);
  assert.match(dal,/context\.member\.role!=='ADMIN'/);
  assert.match(dal,/adminOverview\(context\.pool,context\.identity\)/);
  const form=await readFile(new URL('../components/InvitationDraft.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(form,/fetch\(|action:'invite'|name="objectId"/);
  assert.match(form,/Preparing a message does not send an email/);
});
test('audit descriptions are clear and unknown actions have a safe fallback',()=>{
  assert.equal(accessEventLabel('operator-first-admin-bootstrap'),'First administrator set up');
  assert.equal(accessEventLabel('unknown'),'Access record updated');
});
