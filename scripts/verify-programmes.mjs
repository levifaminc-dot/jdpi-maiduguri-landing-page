import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {programmeImage} from '../src/lib/programmes.ts';
const content=JSON.parse(await readFile('content/snapshot.json','utf8'));
const details=JSON.parse(await readFile('src/data/programme-interventions.json','utf8'));
const report=JSON.parse(await readFile('content/report-projects.json','utf8'));
const projectSlugs=new Set([...content.projects,...report.projects].map(project=>project.slug));
for(const programme of content.programmes){
  const record=details[programme.slug];
  // Future CMS additions use the honest awaiting-confirmation fallback.
  if(!record)continue;
  assert(record.interventions.length>0&&record.source);
  assert(record.locations.every(location=>location.label&&location.detail&&location.source));
  if(!record.locations.length)assert(record.locationNote);
  assert((record.projectSlugs||[]).every(slug=>projectSlugs.has(slug)));
}
const economic=details['economic-empowerment'].projectReach;
const weSing=report.projects.find(project=>project.slug===economic.project);
assert.equal(economic.value,weSing.impactFacts.find(fact=>fact._key==='startup-2025').value);
assert(economic.description.includes('not a total'));
const nutrition=content.programmes.find(programme=>programme.slug==='nutrition');
const before=JSON.stringify(nutrition);
if(nutrition?.image?.url.includes('image-6e84b0743d7530d682cf4caee43e97e94102cd1d-800x400-jpg')){
  assert.equal(programmeImage(nutrition).url,'/assets/projects/echf-into-mami-closeout.jpg');
  assert.equal(JSON.stringify(nutrition),before);
}
const replacement={url:'/assets/new-editor-image.jpg',alt:'New approved nutrition photo'};
assert.equal(programmeImage({title:'Nutrition',slug:'nutrition',body:[],image:replacement}),replacement);
assert.equal(programmeImage({title:'Nutrition',slug:'nutrition',body:[]}),undefined);
for(const programme of content.programmes.filter(programme=>programme.slug!=='nutrition'))assert.equal(programmeImage(programme),programme.image);
console.log('Programmes verified: report photo fallback is scoped, non-mutating and respects replacement CMS images.');
