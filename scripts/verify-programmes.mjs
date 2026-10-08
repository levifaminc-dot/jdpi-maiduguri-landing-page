import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {programmeImage} from '../src/lib/programmes.ts';
const content=JSON.parse(await readFile('content/snapshot.json','utf8'));
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
