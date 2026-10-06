import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
const impactCoverage=JSON.parse(await readFile('src/data/impact-coverage.json','utf8'));
const impactMaps=JSON.parse(await readFile('src/data/impact-maps.json','utf8'));
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
    if(pageName.includes('/contact/')){
      const config=JSON.parse(await readFile('config/contact.json','utf8'));
      if(!html.includes(`action="https://formsubmit.co/${config.recipient}"`)||!html.includes('method="POST"'))errors.push(`${file}: missing configured form delivery`);
      for(const id of ['contact-form','contact-name','contact-email','contact-topic','contact-message','contact-consent'])if(!html.includes(`id="${id}"`))errors.push(`${file}: missing contact form control ${id}`);
      if(!html.includes('https://www.google.com/maps/embed?')||!html.includes('referrerpolicy="strict-origin-when-cross-origin"'))errors.push(`${file}: missing map widget`);
      if(/name="_captcha"[^>]*value="false"/.test(html))errors.push(`${file}: contact form CAPTCHA must remain enabled`);
    }
    if(pageName.includes('/impact/')){
      if((html.match(/role="tab"/g)||[]).length!==9||(html.match(/role="tabpanel"/g)||[]).length!==9)errors.push(`${file}: must include six programme tabs and three state map tabs`);
      for(const region of impactCoverage){
        const map=impactMaps.states.find(state=>state.state===region.state);
        if(!map||JSON.stringify(map.covered.map(area=>area.name))!==JSON.stringify(region.areas))errors.push(`${file}: map coverage differs from report-listed ${region.state} LGAs`);
        if(!html.includes(`data-state-map="${region.state.toLowerCase()}"`))errors.push(`${file}: missing ${region.state} map panel`);
        for(const name of region.areas)if(!html.includes(`aria-label="Show ${name} LGA on ${region.state} map"`))errors.push(`${file}: missing accessible ${region.state}/${name} hotspot`);
      }
      if(!html.includes('CC BY 4.0')||!html.includes('not individual project sites'))errors.push(`${file}: missing boundary attribution or coverage explanation`);
      for(const fact of ['20,229','114','2025','Estimated','unique-person total','263','100'])if(!html.includes(fact))errors.push(`${file}: missing report context ${fact}`);
      if(html.indexOf('id="stories-heading"')>html.indexOf('id="sectors-heading"'))errors.push(`${file}: community stories must lead programme results`);
      for(const id of ['growing-heading','women-heading','enterprise-heading'])if(!html.includes(`aria-labelledby="${id}"`))errors.push(`${file}: missing labelled community story ${id}`);
      for(const asset of ['bmz-greenhouse-monitoring','bmz-greenhouse-crops','bmz-greenhouse-harvest','we-sing-startup-kits'])if(!html.includes(`/assets/projects/${asset}.jpg`))errors.push(`${file}: missing report photograph ${asset}`);
      for(const id of ['stories-heading','sectors-heading','coverage-heading','accountability-heading'])if(!html.includes(`href="#${id}"`))errors.push(`${file}: missing impact section navigation ${id}`);
    }
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
