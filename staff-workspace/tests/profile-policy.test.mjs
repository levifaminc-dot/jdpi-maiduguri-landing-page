import test from 'node:test';
import assert from 'node:assert/strict';
import {applyProfileChanges,profileForViewer,profilePermissions} from '../lib/profile-policy.mjs';
const profile={id:'fictional-owner',name:'Fictional colleague',email:'fictional@jdpimaiduguri.org',title:'Officer',department:'Nutrition',office:'Maiduguri',bio:'',issues:[],phone:'+234 000 000 0000',phoneShared:false,homeAddress:'FICTIONAL — 12 Example Lane'};
const staff={objectId:profile.id,status:'ACTIVE',role:'STAFF',profileEditor:false},other={...staff,objectId:'fictional-other'},editor={...other,profileEditor:true},admin={...other,role:'ADMIN'};
test('owner can edit personal details and introduction but cannot change department, work identity or role',()=>{
  const updated=applyProfileChanges(staff,profile,{phone:'0000000000',phoneShared:false,homeAddress:'FICTIONAL — 14 Example Road',bio:'Fictional introduction'});assert.equal(updated.phoneShared,false);assert.equal(updated.department,'Nutrition');
  for(const patch of [{department:'Finance'},{name:'Other name'},{email:'other@jdpimaiduguri.org'},{id:'other'},{role:'ADMIN'},{profileEditor:true},{status:'ACTIVE'}])assert.throws(()=>applyProfileChanges(staff,profile,patch),{status:403});
});
test('editor manages work profiles, never membership or other people’s personal fields',()=>{
  assert(profilePermissions(editor,profile.id).canEditProfessional);assert.equal(profilePermissions(editor,profile.id).canManageMembers,false);
  const updated=applyProfileChanges(editor,profile,{name:'Fictional revised name',department:'FSL',title:'Fictional officer',office:'Mubi',bio:'Fictional introduction'});assert.equal(updated.department,'Food Security & Livelihoods');assert.equal(updated.homeAddress,profile.homeAddress);
  for(const patch of [{phone:'0000000000'},{phoneShared:true},{homeAddress:'Other address'},{role:'ADMIN'}])assert.throws(()=>applyProfileChanges(editor,profile,patch),{status:403});
});
test('home address and phone are omitted from every nonowner view, even legacy phone-sharing opt-ins',()=>{
  for(const actor of [other,editor,admin]){const view=profileForViewer(actor,profile);assert(!('homeAddress' in view));assert(!('phone' in view));assert(!('phoneShared' in view));assert(!JSON.stringify(view).includes(profile.homeAddress));}
  assert.equal(profileForViewer(staff,profile).homeAddress,profile.homeAddress);
  const shared={...profile,phoneShared:true};for(const actor of [other,editor,admin])assert(!('phone' in profileForViewer(actor,shared)));assert(!('homeAddress' in profileForViewer(editor,shared)));
  assert.throws(()=>applyProfileChanges(staff,profile,{phoneShared:true}),{status:400});
  assert.throws(()=>applyProfileChanges(admin,profile,{homeAddress:'Changed'}),{status:403});
});
test('only administrators and profile editors can set a confirmed work state',()=>{
  assert.throws(()=>applyProfileChanges(staff,profile,{state:'Borno'}),{status:403});
  for(const actor of [editor,admin])for(const state of ['Borno','Yobe','Adamawa',''])assert.equal(applyProfileChanges(actor,profile,{state}).state,state);
  assert.throws(()=>applyProfileChanges(editor,profile,{state:'Lagos'}),{status:400});
});
test('staff cannot edit other profiles, and inactive/unknown roles fail closed',()=>{
  assert.throws(()=>applyProfileChanges(other,profile,{bio:'Altered'}),{status:403});
  for(const actor of [{...editor,status:'SUSPENDED'},{...admin,status:'PENDING'},{...staff,role:'EDITOR'},{...admin,objectId:''},null]){assert.equal(profilePermissions(actor,profile.id).canEditProfessional,false);assert.equal(profilePermissions(actor,profile.id).canManageMembers,false);assert.throws(()=>profileForViewer(actor,profile),{status:403});}
});
test('profile input is bounded and rejects unexpected fields and unsafe contact formats atomically',()=>{
  for(const patch of [{phone:'javascript:alert(1)'},{phone:'123'},{phone:null},{phone:1234567890},{homeAddress:'x'.repeat(501)},{bio:'x'.repeat(601)},{homeAddress:'bad\0address'},{phoneShared:'true'}])assert.throws(()=>applyProfileChanges(staff,profile,patch),{status:400});
  assert.throws(()=>applyProfileChanges(editor,profile,{email:'outside@example.invalid'}),{status:400});
  const original=JSON.stringify(profile);assert.throws(()=>applyProfileChanges(staff,profile,{bio:'Allowed',department:'Finance'}),{status:403});assert.equal(JSON.stringify(profile),original);
});
