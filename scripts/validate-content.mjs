import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {applyReportProjects} from '../src/lib/report-projects.ts';
const file=process.argv[2]||'content/snapshot.json';
const data=JSON.parse(readFileSync(file,'utf8'));
export function validateContent(data){
  const errors=[];
  const requireText=(value,label)=>{if(typeof value!=='string'||!value.trim())errors.push(`${label} is missing.`);};
  if(data.schemaVersion!==1)errors.push('Unsupported content schema version.');
  for(const key of ['organisationName','shortName','diocese','email','seoTitle','seoDescription'])requireText(data.settings?.[key],`settings.${key}`);
  if(data.settings?.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.settings.email))errors.push('Contact email is invalid.');
  function https(value,label){if(!value)return;try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch{errors.push(`${label} must be a valid HTTPS URL.`);}}
  https(data.settings?.donationUrl,'Donation link');
  for(const link of data.settings?.socialLinks||[])https(link.url,'Social link');
  const asset=image=>{if(!image?.url)return;requireText(image.alt,'Image description');if(image.url.startsWith('/assets/')){const p=path.resolve('public','.'+image.url);if(!p.startsWith(path.resolve('public/assets')+path.sep)||!existsSync(p))errors.push(`Missing local asset: ${image.url}`);}else{https(image.url,'Image URL');}};
  for(const key of ['heroStatement','heroHighlight','heroIntro','aboutIntro','programmeHeading','projectsHeading','storiesHeading','partnersHeading','partnersIntro','supportIntro'])requireText(data.home?.[key],`home.${key}`);
  for(const key of ['heroImage','aboutImage','impactImage','supportImage']){if(!data.home?.[key]?.url)errors.push(`home.${key} is missing.`);asset(data.home?.[key]);}
  if(!data.home?.impactFacts?.length)errors.push('At least one impact figure is required.');
  for(const fact of data.home?.impactFacts||[]){requireText(fact.value,'Impact figure');requireText(fact.label,'Impact label');}
  for(const type of ['programmes','projects','stories','reports']){
    if(!Array.isArray(data[type])){errors.push(`${type} must be an array.`);continue;}
    const slugs=new Set();
    for(const item of data[type]){requireText(item.title,`${type} title`);if(type!=='reports'||item.slug){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug||''))errors.push(`Invalid slug: ${item.slug}`);if(slugs.has(item.slug))errors.push(`Duplicate ${type} slug: ${item.slug}`);slugs.add(item.slug);}asset(item.image);
      if(!Array.isArray(item.body))errors.push(`Body must be Portable Text: ${item.title}`);
      if(item.publishedAt&&Number.isNaN(Date.parse(item.publishedAt)))errors.push(`Invalid date: ${item.title}`);
      if(type==='stories'&&!['Stories','News','Events','Publications'].includes(item.category))errors.push(`Invalid story category: ${item.title}`);
      if(type==='reports'){
        if(!item.fileUrl)errors.push(`Report has no download: ${item.title}`);
        else if(item.fileUrl.startsWith('/assets/sanity/')){const download=path.resolve('public','.'+item.fileUrl);if(!download.startsWith(path.resolve('public/assets/sanity')+path.sep)||!existsSync(download))errors.push(`Missing report file: ${item.title}`);}
        else https(item.fileUrl,'Report file');
      }
    }
  }
  if(errors.length)throw new Error(errors.join('\n'));
  return data;
}
validateContent(data);
const supplemented=validateContent(applyReportProjects(data));
console.log(`Content valid: ${supplemented.programmes.length} programmes, ${supplemented.projects.length} projects, ${supplemented.stories.length} stories, ${supplemented.reports.length} reports.`);
