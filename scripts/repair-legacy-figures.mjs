// Explicit, narrow repair. No values, labels, array keys, profiles or other fields
// are changed. Preserve both published content and any independent draft edits.
import {createClient} from '@sanity/client';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const settings=JSON.parse(await readFile('config/sanity.json','utf8'));
const token=process.env.SANITY_AUTH_TOKEN||process.env.SANITY_API_WRITE_TOKEN;
if(!token)throw Error('Use the existing authenticated Sanity CLI with --with-user-token. Never paste credentials into chat.');
const client=createClient({...settings,apiVersion:'2026-10-05',useCdn:false,perspective:'raw',token});
const docs=await client.fetch('*[_type in ["homePage","project"] && defined(impactFacts)]');
const plans=[];
for(const doc of docs){
  const expected=doc._type==='homePage'?'impactFact':'projectImpactFact';
  const changes={};
  for(const fact of doc.impactFacts){
    if(fact._type===expected)continue;
    if(![undefined,'rootItem'].includes(fact._type)||!fact._key||typeof fact.value!=='string'||typeof fact.label!=='string'||Object.keys(fact).some(key=>!['_key','_type','value','label'].includes(key)))throw Error(`Unexpected figure structure in ${doc._id}; no automatic repair is safe.`);
    changes[`impactFacts[_key==${JSON.stringify(fact._key)}]._type`]=expected;
  }
  if(Object.keys(changes).length)plans.push({doc,changes,expected});
}
console.log(JSON.stringify({mode:process.argv.includes('--write')?'repair':'dry-run',documents:plans.length,items:plans.reduce((sum,plan)=>sum+Object.keys(plan.changes).length,0),valuesLabelsAndKeys:'unchanged',drafts:'independently preserved'}));
if(!process.argv.includes('--write')||!plans.length)process.exit(0);
await mkdir('artifacts',{recursive:true});
await writeFile(`artifacts/legacy-figures-before-${Date.now()}.json`,JSON.stringify(plans.map(({doc})=>({_id:doc._id,_rev:doc._rev,_type:doc._type,impactFacts:doc.impactFacts})),null,2),{flag:'wx'});
for(const {doc,changes,expected} of plans){
  await client.patch(doc._id).ifRevisionId(doc._rev).set(changes).commit();
  const saved=await client.getDocument(doc._id);
  const intended=doc.impactFacts.map(fact=>({...fact,_type:expected}));
  if(!isDeepStrictEqual(saved?.impactFacts,intended))throw Error(`Verification failed for ${doc._id}. Do not rerun blindly; inspect the preserved backup.`);
}
console.log('Legacy figure types repaired and verified. No figures, labels, keys, profile content or access settings changed.');
