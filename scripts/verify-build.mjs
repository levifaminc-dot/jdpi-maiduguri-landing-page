import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();}
const htmlFiles=(await files('dist')).filter(file=>file.endsWith('.html'));
const errors=[];
for(const file of htmlFiles){
  const html=await readFile(file,'utf8');
  for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const url=m[1].split('#')[0].split('?')[0];
    if(!url||!url.startsWith('/')||url.startsWith('//'))continue;
    const target=path.join('dist',decodeURIComponent(url));
    try{await access(url.endsWith('/')?path.join(target,'index.html'):target);}catch{errors.push(`${file}: missing ${url}`);}
  }
  if(/SANITY_API_(?:READ|WRITE)_TOKEN|ghp_[A-Za-z0-9]+/.test(html))errors.push(`${file}: possible credential in build output.`);
}
for(const file of ['dist/index.html','dist/projects/index.html','dist/stories/index.html','dist/resources/index.html','dist/donate/index.html','dist/sitemap-index.xml','dist/robots.txt'])try{await access(file);}catch{errors.push(`Missing required build output: ${file}`);}
if(errors.length)throw new Error(errors.join('\n'));
console.log(`Verified ${htmlFiles.length} HTML pages: local links and assets resolve; required routes and metadata files exist.`);
