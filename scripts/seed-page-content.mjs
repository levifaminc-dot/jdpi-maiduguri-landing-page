// Explicit, idempotent expansion of the existing published editorial content.
// Not run by builds. Never writes drafts or replaces existing page/profile fields.
import {createClient} from '@sanity/client';
import {getCliClient} from '@sanity/cli';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import catalogue from '../content/page-fields.json' with {type:'json'};
import pageData from '../content/page-data.json' with {type:'json'};
import interventions from '../src/data/programme-interventions.json' with {type:'json'};
import snapshot from '../content/snapshot.json' with {type:'json'};
import {applyReportProjects} from '../src/lib/report-projects.ts';
import {getProjectProfile} from '../src/lib/project-profiles.ts';
import {directoryDetails} from '../src/lib/project-directory.ts';
import {programmeImage} from '../src/lib/programmes.ts';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const settings=JSON.parse(await readFile('config/sanity.json','utf8'));
const write=process.argv.includes('--write');
const content=applyReportProjects(snapshot);
console.log(JSON.stringify({mode:write?'seed':'dry-run',pages:catalogue.length,projectProfiles:content.projects.length,programmeDetails:Object.keys(interventions).length,existingEdits:'preserved',drafts:'untouched'}));
if(!write)process.exit(0);
let token=process.env.SANITY_API_WRITE_TOKEN||process.env.SANITY_AUTH_TOKEN;
if(!token){try{process.chdir(path.join(root,'studio'));token=getCliClient({apiVersion:'2026-10-05'}).config().token;}finally{process.chdir(root);}}
if(!token)throw Error('No existing Sanity write authentication is available. Sign in with the organisation-owned account; do not paste a token into chat.');
const client=createClient({projectId:settings.projectId,dataset:settings.dataset,apiVersion:'2026-10-05',useCdn:false,perspective:'published',token});
const existing=await client.fetch('*[_type in ["project","programme"]]{...}');
const imageCache=new Map();
async function convert(value,key='root'){
  if(Array.isArray(value))return Promise.all(value.map(async(item,index)=>{const converted=await convert(item,key);return converted&&typeof converted==='object'?{...converted,_type:converted._type||(key==='impactFacts'?'projectImpactFact':`${key}Item`),_key:item._key||`item-${index}`} :converted;}));
  if(value&&typeof value==='object'){
    if(typeof value.url==='string'&&typeof value.alt==='string'){
      if(!value.url.startsWith('/assets/'))throw Error('Only reviewed committed image assets can be seeded.');
      const location=path.resolve(root,'public','.'+value.url);
      if(!location.startsWith(path.resolve(root,'public/assets')+path.sep))throw Error('Invalid source asset path.');
      let asset=imageCache.get(value.url);
      if(!asset){asset=await client.assets.upload('image',await readFile(location),{filename:path.basename(location)});imageCache.set(value.url,asset);}
      return {_type:'editorialImage',alt:value.alt,asset:{_type:'reference',_ref:asset._id}};
    }
    return Object.fromEntries(await Promise.all(Object.entries(value).filter(([name])=>!['_id','_rev','_createdAt','_updatedAt','assetId'].includes(name)).map(async([name,item])=>[name,await convert(item,name)])));
  }
  return value;
}
for(const page of catalogue){
  const published=await client.getDocument(page.type);
  const defaults=Object.fromEntries(page.fields.filter(field=>published?.[field.name]===undefined).map(field=>[field.name,field.initialValue]));
  const fields=await convert(defaults);
  if(page.route in pageData){
    if(published?.data==null)fields.data=await convert(pageData[page.route]);
    else for(const [key,value] of Object.entries(pageData[page.route]))if(published.data[key]==null)fields[`data.${key}`]=await convert(value,key);
  }
  if(published){if(Object.keys(fields).length)await client.patch(page.type).setIfMissing(fields).commit();}
  else await client.createIfNotExists({_id:page.type,_type:page.type,...fields});
  console.log(`Prepared ${page.title}; existing content retained.`);
}
for(const item of content.projects){
  let doc=existing.find(doc=>doc._type==='project'&&doc.slug?.current===item.slug);
  if(doc?.profile)continue;
  const profile=await convert(getProjectProfile(item));
  if(!doc){
    const id=`editorial-project-${createHash('sha256').update(item.slug).digest('hex').slice(0,24)}`;
    const fields=await convert({...item,profile:undefined,projectProgrammes:undefined});
    delete fields.profile;delete fields.projectProgrammes;
    const refs=(item.projectProgrammes||[]).map(programme=>existing.find(doc=>doc._type==='programme'&&doc.slug?.current===programme.slug)).filter(Boolean).map((doc,index)=>({_type:'reference',_ref:doc._id,_key:`programme-${index}`}));
    await client.createIfNotExists({...fields,_id:id,_type:'project',slug:{_type:'slug',current:item.slug},profile,projectProgrammes:refs,sourceKey:`editorial-project:${item.slug}`});
  }else{
    // Apply already-approved report corrections only where the published field
    // is unchanged since the pre-migration backup. Concurrent edits win.
    const original=snapshot.projects.find(project=>project.slug===item.slug);
    const updates={};const unset=[];
    const equal=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
    for(const key of ['title','summary','body','location','status','startDate','endDate','impactFacts','reportingYear','imageCaption']){
      if(equal(doc[key],original?.[key])&&!equal(item[key],original?.[key])){
        if(item[key]===undefined)unset.push(key);else updates[key]=await convert(item[key]);
      }
    }
    // The raw export keeps asset references; compare those rather than CDN URLs.
    const raw=(await readFile('content/documents.ndjson','utf8')).split('\n').filter(Boolean).map(line=>JSON.parse(line)).find(record=>record._id===doc._id);
    if(JSON.stringify(doc.image)===JSON.stringify(raw?.image)&&item.image?.url!==original?.image?.url)updates.image=await convert(item.image);
    const directory=directoryDetails(item);
    const defaults={profile};
    for(const key of ['status','location'])if(!doc[key]&&!updates[key]&&directory[key])defaults[key]=directory[key];
    if(directory.hasDuration){
      const dates={startDate:item.startDate||undefined,endDate:item.endDate||undefined};
      // Preserve the organisation-supplied template dates already displayed.
      if(!dates.startDate||!dates.endDate){
        const ranges={'bmz-multisectoral-resilience-project':['2022-11-01','2026-08-31'],'echf-into-mami-project':['2024-04-01','2026-09-30'],'nhf-integrated-nutrition-and-protection':['2025-11-01','2026-05-31']};
        if(ranges[item.slug]){dates.startDate||=ranges[item.slug][0];dates.endDate||=ranges[item.slug][1];}
      }
      for(const [key,value] of Object.entries(dates))if(value&&!doc[key]&&!unset.includes(key))defaults[key]=value;
    }
    if(doc.projectProgrammes==null){
      const tags={'FSL':'food-security-and-livelihoods',Nutrition:'nutrition',WaSH:'water-sanitation-and-hygiene',Protection:'protection',MHPSS:'mental-health-and-psychosocial-support',SCPB:'peacebuilding-and-social-cohesion'};
      defaults.projectProgrammes=directory.tags.map(tag=>existing.find(doc=>doc._type==='programme'&&doc.slug?.current===tags[tag])).filter(Boolean).map((doc,index)=>({_type:'reference',_ref:doc._id,_key:`programme-${index}`}));
    }
    let patch=client.patch(doc._id).ifRevisionId(doc._rev).setIfMissing(defaults);
    if(Object.keys(updates).length)patch=patch.set(updates);
    if(unset.length)patch=patch.unset(unset);
    await patch.commit();
  }
}
for(const doc of existing.filter(doc=>doc._type==='programme')){
  const details=interventions[doc.slug?.current];
  const placeholder='image-6e84b0743d7530d682cf4caee43e97e94102cd1d-800x400-jpg';
  const correctImage=doc.slug?.current==='nutrition'&&doc.image?.asset?._ref===placeholder?programmeImage({...doc,slug:'nutrition',image:{url:`/assets/sanity/${placeholder}.jpg`,assetId:placeholder,alt:doc.image.alt}}):undefined;
  if((details&&!doc.details)||correctImage){
    let patch=client.patch(doc._id).ifRevisionId(doc._rev);
    if(details&&!doc.details)patch=patch.setIfMissing({details:await convert(details)});
    if(correctImage)patch=patch.set({image:await convert(correctImage)});
    await patch.commit();
  }
}
// Mark the collection authoritative only after all projects are ready.
await client.patch('projectsPage').setIfMissing({cmsManagedProjects:true}).commit();
console.log('Page expansion complete. No drafts, existing page edits, membership or credentials were changed.');
