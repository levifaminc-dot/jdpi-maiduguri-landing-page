import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parse} from 'groq-js';
import catalogue from '../content/page-fields.json' with {type:'json'};
import defaults from '../content/page-data.json' with {type:'json'};
import snapshot from '../content/snapshot.json' with {type:'json'};
import {pageEditor,safeEditorialImage} from '../src/lib/page-editor.ts';
import {applyReportProjects} from '../src/lib/report-projects.ts';
import {getProjectProfile} from '../src/lib/project-profiles.ts';
import {CONTENT_QUERY,EXPORT_QUERY,RELEASE_QUERY} from '../src/lib/queries.ts';
import {validatePageContent} from './validate-page-content.mjs';
import {getPublishedResources} from '../src/lib/resources.ts';
import {getWebsiteUpdates} from '../src/lib/stories.ts';
test('all ten public pages have named fields, fallback content and release-query coverage',()=>{
  assert.equal(catalogue.length,10);
  for(const definition of catalogue){
    assert(EXPORT_QUERY.includes(`"${definition.type}"`));
    assert.equal(new Set(definition.fields.map(field=>field.name)).size,definition.fields.length);
    const page=pageEditor({...snapshot,pages:[]},definition.route);
    for(const field of definition.fields)assert.deepEqual(field.kind==='image'?page.image(field.name):page.text(field.name),field.initialValue);
  }
  for(const query of [CONTENT_QUERY,EXPORT_QUERY,RELEASE_QUERY])assert.doesNotThrow(()=>parse(query));
});
test('published values and deliberately emptied lists beat fallbacks without mutating the snapshot',()=>{
  const definition=catalogue[0];const field=definition.fields.find(field=>field.kind==='heading');
  const content={...snapshot,pages:[{_id:definition.type,fields:{[field.name]:'Updated approved heading'},data:{timeline:[]}}]};
  const page=pageEditor(content,definition.route);
  assert.equal(page.text(field.name),'Updated approved heading');
  assert.deepEqual(page.data('timeline',defaults.about.timeline),[]);
  assert.equal(page.data('values',defaults.about.values),defaults.about.values);
  assert.equal(content.pages[0].fields[field.name],'Updated approved heading');
});
test('CMS project edits are never overwritten by the historical report supplement',()=>{
  const project=applyReportProjects(snapshot).projects[0];
  const profile={...getProjectProfile(project),overview:['Updated approved project overview']};
  const edited={...project,status:'ongoing',summary:'Updated approved summary',profile};
  const result=applyReportProjects({...snapshot,projects:[edited]});
  assert.equal(result.projects.find(item=>item.slug===project.slug),edited);
  assert.equal(getProjectProfile(edited),profile);
});
test('completed CMS migration honours project deletion without resurrecting report fallbacks',()=>{
  const result=applyReportProjects({...snapshot,projectsManaged:true,projects:[]});
  assert.deepEqual(result.projects,[]);
});
test('resource edits flow to both Resources and Stories, with empty lists honoured',()=>{
  const report={title:'Approved edited report',category:'Annual reports',year:2025,summary:'Updated report summary',fileUrl:'https://jdpimaiduguri.org/approved.pdf'};
  const content={...snapshot,reports:[],pages:[{_id:'resourcesPage',fields:{},data:{legacyReports:[report]}}]};
  assert.equal(getPublishedResources(content)[0].title,report.title);
  assert(getWebsiteUpdates(content).some(item=>item.document&&item.title===report.title));
  content.pages[0].data.legacyReports=[];
  assert.deepEqual(getPublishedResources(content),[]);
  assert(!getWebsiteUpdates(content).some(item=>item.document));
});
test('editorial images accept only known local assets or Sanity image delivery',()=>{
  assert(safeEditorialImage('/assets/about/peace-conference.jpg'));
  assert(safeEditorialImage('https://cdn.sanity.io/images/project/production/a.jpg'));
  for(const url of ['javascript:alert(1)','https://attacker.example/track.jpg','/assets/../secret','https://token@cdn.sanity.io/images/project/x.jpg'])assert(!safeEditorialImage(url));
});
test('structured page data validates approved defaults and rejects malformed lists or results',()=>{
  const content={...snapshot,pages:Object.entries(defaults).map(([route,data])=>({_id:catalogue.find(page=>page.route===route).type,fields:{},data}))};
  const checkImage=image=>{assert(image.alt);assert(safeEditorialImage(image.url));};
  assert.doesNotThrow(()=>validatePageContent(content,checkImage));
  const broken=structuredClone(content);broken.pages.find(page=>page._id==='impactPage').data.impactOverview[0].value=42;
  assert.throws(()=>validatePageContent(broken,checkImage));
});
