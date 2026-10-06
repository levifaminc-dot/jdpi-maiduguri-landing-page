import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();}
const htmlFiles=(await files('dist')).filter(file=>file.endsWith('.html'));
const errors=[];
for(const file of htmlFiles){
  const html=await readFile(file,'utf8');
  const pageName=file.replaceAll('\\','/');
  if(pageName==='dist/contact/index.html'||pageName==='dist/impact/index.html'){
    const sections=pageName.includes('/contact/')?['contact-heading','enquiry-heading','office-heading']:['impact-heading','overview-heading','sectors-heading','coverage-heading','stories-heading','accountability-heading'];
    for(const id of sections)if(!html.includes(`id="${id}"`))errors.push(`${file}: missing section ${id}`);
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: must have exactly one main heading`);
    if(/href="#"/.test(html))errors.push(`${file}: placeholder link`);
    if(pageName.includes('/contact/')&&(!html.includes('href="mailto:')||!html.includes('href="tel:')))errors.push(`${file}: missing working contact channels`);
    if(pageName.includes('/impact/'))for(const fact of ['20,229','114','2025','Estimated','unique-person total'])if(!html.includes(fact))errors.push(`${file}: missing report context ${fact}`);
  }
  if(/^dist[\\/]resources[\\/]index\.html$/.test(file)){
    for(const id of ['resources-heading','library-heading','resource-list','media-heading'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing resource section ${id}`);
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: resources must have exactly one main heading`);
    if(!html.includes('data-resource-filter=')||!html.includes('data-resource-category='))errors.push(`${file}: missing document filtering`);
    if(/href="#"/.test(html))errors.push(`${file}: placeholder resource link`);
  }
  if(/^dist[\\/]projects[\\/][^\\/]+[\\/]index\.html$/.test(file)){
    for(const section of ['overview','context','what-we-did','results','stories','gallery','resources']){
      if(!html.includes(`id="${section}"`))errors.push(`${file}: missing project detail section ${section}`);
      if(!html.includes(`href="#${section}"`))errors.push(`${file}: missing section navigation ${section}`);
    }
    if((html.match(/<h1\b/g)||[]).length!==1)errors.push(`${file}: project detail must have exactly one main heading`);
  }
  for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const url=m[1].split('#')[0].split('?')[0];
    if(!url||!url.startsWith('/')||url.startsWith('//'))continue;
    const target=path.join('dist',decodeURIComponent(url));
    try{await access(url.endsWith('/')?path.join(target,'index.html'):target);}catch{errors.push(`${file}: missing ${url}`);}
  }
  if(/SANITY_API_(?:READ|WRITE)_TOKEN|ghp_[A-Za-z0-9]+/.test(html))errors.push(`${file}: possible credential in build output.`);
}
for(const file of ['dist/index.html','dist/projects/index.html','dist/stories/index.html','dist/resources/index.html','dist/contact/index.html','dist/impact/index.html','dist/donate/index.html','dist/sitemap-index.xml','dist/robots.txt'])try{await access(file);}catch{errors.push(`Missing required build output: ${file}`);}
if(errors.length)throw new Error(errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages: local links and assets resolve; required routes and metadata files exist.`);
