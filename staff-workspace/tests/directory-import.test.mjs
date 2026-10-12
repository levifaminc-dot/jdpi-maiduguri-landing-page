import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDirectoryCsv,prepareDirectoryPreview,filterDirectory,directoryEmail,directoryInitials} from '../lib/directory-import.mjs';
import {readFile} from 'node:fs/promises';
import {allowLocalPreview} from '../lib/preview-policy.mjs';
const oid='00000000-0000-4000-8000-000000000001';
const row=(extra={})=>({'Display name':'Fictional colleague','User principal name':'fictional@example.invalid','Object Id':oid,'Block credential':'False',...extra});
test('CSV handles BOM, quoted commas, doubled quotes and multiline fields without executing content',()=>{
  const rows=parseDirectoryCsv('\uFEFFDisplay name,User principal name,Object Id,Title\r\n"Fictional, colleague",fictional@jdpimaiduguri.org,'+oid+',"A ""quoted""\nrole"\r\n');
  assert.equal(rows.length,1);assert.equal(rows[0]['Display name'],'Fictional, colleague');assert.equal(rows[0].Title,'A "quoted"\nrole');
  for(const text of ['Display name,User principal name,Object Id\n"unclosed,x,y','Display name,User principal name,Object Id\nx,y','Display name,Display name\nx,y'])assert.throws(()=>parseDirectoryCsv(text));
});
test('allowlisted preview omits identity IDs, phones, home addresses and security/licence metadata',()=>{
  const {profiles,summary}=prepareDirectoryPreview([row({'User principal name':'fictional@jdpimaiduguri.org',Title:'Officer',Department:'Programmes',Office:'Maiduguri','Mobile Phone':'private-phone','Street address':'private-address','Licenses':'private-licence','Last password change time stamp':'private-time'})]);
  assert.deepEqual(Object.keys(profiles[0]).sort(),['id','name','email','title','department','office','state','bio','issues'].sort());
  const output=JSON.stringify(profiles);for(const value of [oid,'private-phone','private-address','private-licence','private-time'])assert(!output.includes(value));assert.equal(summary.candidates,1);
});
test('guests are omitted before serialisation; blocked, duplicate and malformed accounts require review',()=>{
  const rows=[row({'User principal name':'fictional@jdpimaiduguri.org'}),row({'User principal name':'guest_example.com#EXT#@tenant.onmicrosoft.com','Object Id':'00000000-0000-4000-8000-000000000002'}),row({'User principal name':'blocked@jdpimaiduguri.org','Object Id':'00000000-0000-4000-8000-000000000003','Block credential':'True'}),row({'User principal name':'fictional@jdpimaiduguri.org','Object Id':'not-a-uuid'})];
  const {profiles,summary}=prepareDirectoryPreview(rows);assert.equal(summary.candidates,0);assert.equal(summary.review,3);assert.equal(summary.guestsExcluded,1);assert.equal(summary.total,3);assert(!JSON.stringify(profiles).includes('Guest account'));assert(profiles.some(p=>p.issues.includes('Sign-in blocked')));assert(profiles.some(p=>p.issues.includes('Duplicate account')));assert(!profiles.some(p=>'role' in p||'status' in p));
});
test('search and filters match names, titles, departments and offices, including empty results',()=>{
  const {profiles}=prepareDirectoryPreview([row({'User principal name':'fictional@jdpimaiduguri.org',Title:'Programme Officer',Office:'Mubi',Department:'Programmes'})]);
  assert.equal(filterDirectory(profiles,{query:'OFFICER',office:'Mubi'}).length,1);assert.equal(filterDirectory(profiles,{department:'Finance'}).length,0);assert.equal(filterDirectory(profiles,{scope:'review'}).length,0);assert.equal(directoryInitials('  Fictional Colleague '),'FC');
});
test('only validated JDPI work addresses become mail links; missing fields remain blank',()=>{
  for(const value of ['mailto:x@jdpimaiduguri.org','x@jdpimaiduguri.org\r\nBcc:other@example.invalid','x@external.invalid','x#EXT#@tenant.onmicrosoft.com'])assert.equal(directoryEmail(value),false);
  const {profiles}=prepareDirectoryPreview([row({'User principal name':'fictional@jdpimaiduguri.org'})]);assert.equal(profiles[0].title,'');assert.equal(profiles[0].office,'');assert.equal(profiles[0].bio,'');
  const guest=prepareDirectoryPreview([row({'Display name':'personal@example.invalid','User principal name':'personal_example.invalid#EXT#@tenant.onmicrosoft.com'})]);assert.equal(guest.profiles.length,0);assert(!JSON.stringify(guest).includes('personal@example.invalid'));
});
test('explicit Guest membership excludes even a JDPI-address guest from every scope and tag list',()=>{
  for(const extra of [{MemberType:'Guest'},{'User type':'GUEST'}]){const result=prepareDirectoryPreview([row({'User principal name':'guest@jdpimaiduguri.org',...extra})]);assert.equal(result.summary.guestsExcluded,1);for(const scope of ['candidates','all','review'])assert.equal(filterDirectory(result.profiles,{scope}).length,0);}
});
test('private preview file is runtime-only and guarded before it is read; production and Vercel fail closed',async()=>{
  for(const config of [{nodeEnv:'production',host:'localhost:4330'},{nodeEnv:'development',vercel:'1',host:'localhost:4330'},{nodeEnv:'development',host:'staff.jdpimaiduguri.org'},{nodeEnv:'development',host:'localhost.evil.invalid'}])assert.equal(allowLocalPreview(config),false);
  const source=await readFile(new URL('../lib/directory-preview.ts',import.meta.url),'utf8');
  assert(source.includes("import 'server-only'"));assert(source.indexOf('if(!allowLocalPreview')<source.indexOf('await stat(source)'));assert(!source.includes('/Downloads/'));assert(!source.includes('getPool'));assert(!source.includes('changeMember'));
  const page=await readFile(new URL('../app/preview/directory/page.tsx',import.meta.url),'utf8');assert(page.includes('if(!data)notFound()'));
});
