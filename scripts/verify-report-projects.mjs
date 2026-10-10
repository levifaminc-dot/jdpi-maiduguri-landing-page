import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyReportProjects} from '../src/lib/report-projects.ts';

const snapshot=JSON.parse(readFileSync('content/snapshot.json','utf8'));
const untouched=structuredClone(snapshot);
const content=applyReportProjects(snapshot);
assert.deepEqual(snapshot,untouched,'Supplement must not mutate the CMS snapshot');
assert.deepEqual(applyReportProjects(content),content,'Repeated application must not duplicate report paragraphs');
assert.equal(new Set(content.projects.map(project=>project.slug)).size,content.projects.length,'Project slugs must be unique');
for(const key of ['settings','home','programmes','partners','stories','reports']) assert.deepEqual(content[key],snapshot[key]);
if(!content.projectsManaged)for(const slug of ['echo-sahara-project','we-sing-project','gffo-food-security-humanitarian-protection-lake-chad','strengthening-protection-gbv-response-madagali','allright-project']){
  const project=content.projects.find(project=>project.slug===slug);
  assert.ok(project,`Missing ${slug}`);
  if(project.profile){
    assert.deepEqual(project,snapshot.projects.find(item=>item.slug===slug),'Published CMS profiles must take priority over historical report defaults');
    continue;
  }
  assert.equal(project.status,'ongoing');
  assert.equal(project.reportingYear,2025);
  assert.equal(project.startDate,undefined,'Do not invent contract dates');
  assert.equal(project.endDate,undefined,'Do not invent closure dates');
  assert.ok(project.body.length>0);
}
const allright=content.projects.find(project=>project.slug==='allright-project');
if(!content.projectsManaged&&!allright?.profile)assert.deepEqual(allright?.impactFacts,[],'Remove unsupported ALLRight beneficiary totals');
for(const original of snapshot.projects) assert.equal(content.projects.find(project=>project.slug===original.slug)._id,original._id,'Preserve existing editor IDs');
console.log('Report supplement verified: ongoing statuses, no invented dates, preserved CMS data and idempotent merging.');
