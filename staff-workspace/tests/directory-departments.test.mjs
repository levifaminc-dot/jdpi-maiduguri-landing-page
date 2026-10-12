import test from 'node:test';
import assert from 'node:assert/strict';
import {departmentGroups,normaliseDepartment,departmentOptions} from '../lib/directory-departments.mjs';
import {prepareDirectoryPreview,filterDirectory} from '../lib/directory-import.mjs';

test('all known department aliases resolve consistently, including case, whitespace and punctuation',()=>{
  for(const group of departmentGroups)for(const alias of [group.name,...group.aliases]) {
    assert.equal(normaliseDepartment(alias),group.name);
    assert.equal(normaliseDepartment(`  ${alias.toUpperCase().replaceAll(' ','  ')}  `),group.name);
    assert.equal(normaliseDepartment(normaliseDepartment(alias)),group.name);
  }
  assert.equal(normaliseDepartment('Procurement / Logistics'),'Procurement & Logistics');
});
test('combined and distinct programme teams are not collapsed into different departments',()=>{
  const names=['Protection','MHPSS','MHPSS and Protection','Household Streengthening','SILC','Alright'].map(normaliseDepartment);
  assert.equal(new Set(names).size,names.length);
  assert.equal(names[2],'Protection & MHPSS');
  assert.equal(normaliseDepartment('New specialist team'),'New specialist team');
  assert.equal(normaliseDepartment(null),'');assert.equal(normaliseDepartment('  '),'');
});
test('import, filter options and searches share the same canonical labels without altering the source',()=>{
  const rows=['FSL','Food Security Livelihood','Food Security and Livielihood','Nutrtion','Program'].map((Department,i)=>({'Display name':`Fictional ${i}`,'User principal name':`fictional${i}@jdpimaiduguri.org`,'Object Id':`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,'Block credential':'False',Department}));
  const original=JSON.stringify(rows);const {profiles,summary}=prepareDirectoryPreview(rows);
  assert.deepEqual(departmentOptions(profiles),['Food Security & Livelihoods','Nutrition','Programmes']);
  assert.equal(filterDirectory(profiles,{department:'Food Security & Livelihoods'}).length,3);
  assert.equal(filterDirectory(profiles,{department:'FSL'}).length,3);
  assert.equal(filterDirectory(profiles,{query:'FSL'}).length,3);
  assert.equal(filterDirectory(profiles,{query:'Nutrtion'}).length,1);
  assert.equal(summary.total,5);assert.equal(summary.candidates,5);assert.equal(JSON.stringify(rows),original);
});
test('the 28 observed dropdown labels become 17 unique departments with no record loss',()=>{
  const labels=['Admin','Administration','Alright','FSL','Finance','Food Security Livelihood','Food Security and Livelihood','Food Security and Livielihood','Household Streengthening','ICT','MEAL','MHPSS','MHPSS and Protection','Nutrition','Nutrtion','Operations','Procurement and Logistics','Procurement/Logistics','Program','Programme','Programs','Protection','Protection and MHPSS','SILC','Safety and Security','Security','WaSH','WaSh'];
  const options=departmentOptions(labels.map(department=>({department})));
  assert.equal(options.length,17);assert.equal(labels.length,28);
  assert.deepEqual(options,[...departmentGroups.map(group=>group.name)].sort((a,b)=>a.localeCompare(b,'en')));
});
