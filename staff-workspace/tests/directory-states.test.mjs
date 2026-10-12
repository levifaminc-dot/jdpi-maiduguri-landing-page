import test from 'node:test';
import assert from 'node:assert/strict';
import {stateForOffice} from '../lib/directory-states.mjs';
import {prepareDirectoryPreview,filterDirectory} from '../lib/directory-import.mjs';
test('work states use known office locations; ambiguous offices and residential fields are not guessed',()=>{
  for(const [office,state] of [['Bama','Borno'],['  Maiduguri  - Roving ','Borno'],['Damaturu Office','Yobe'],['Potiskum','Yobe'],['Mubi Office','Adamawa'],['Michika','Adamawa']])assert.equal(stateForOffice(office),state);
  for(const office of ['Uba','Head Office','Salama','','Unknown'])assert.equal(stateForOffice(office),'');
  const rows=['Mubi','Damaturu','Maiduguri','Uba'].map((Office,index)=>({'Display name':`Fictional ${index}`,'User principal name':`fictional${index}@jdpimaiduguri.org`,'Object Id':`00000000-0000-4000-8000-00000000000${index}`,'Block credential':'False',Department:'FSL',Office,StateOrProvince:'WRONG HOME STATE'}));
  const {profiles}=prepareDirectoryPreview(rows);
  for(const state of ['Borno','Yobe','Adamawa','unset'])assert.equal(filterDirectory(profiles,{state}).length,1);
  assert.equal(filterDirectory(profiles,{state:'Adamawa',department:'Food Security & Livelihoods',office:'Mubi',query:'fictional'}).length,1);
  assert.equal(filterDirectory(profiles,{state:'Yobe',office:'Mubi'}).length,0);assert(!JSON.stringify(profiles).includes('WRONG HOME STATE'));
});
