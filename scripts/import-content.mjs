import {createClient} from '@sanity/client';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const seed=JSON.parse(await readFile('content/seed.json','utf8'));
const write=process.argv.includes('--write');
const counts=Object.fromEntries(['programmes','projects','stories','reports','partners'].map(type=>[type,seed[type].length]));
console.log(JSON.stringify({mode:write?'import':'dry-run',counts,singletons:2,source:'committed Canva reference',existingDocuments:'preserved'},null,2));
if(!write){console.log('No writes made. Review docs/MIGRATION.md, then run npm run content:import -- --write once the Sanity project is connected.');process.exit(0);}
const projectId=process.env.PUBLIC_SANITY_PROJECT_ID,dataset=process.env.PUBLIC_SANITY_DATASET,token=process.env.SANITY_API_WRITE_TOKEN;
if(!projectId||!dataset||!token)throw new Error('Set the Sanity project, dataset and server-only write token before importing.');
const client=createClient({projectId,dataset,token,apiVersion:'2026-10-05',useCdn:false,perspective:'published'});
const imageCache=new Map();
async function upload(image){if(!image?.url)return undefined;if(imageCache.has(image.url))return imageCache.get(image.url);if(!image.url.startsWith('/assets/'))throw new Error('Seed images must be local committed assets.');const assetPath=path.resolve('public','.'+image.url);if(!assetPath.startsWith(path.resolve('public/assets')+path.sep))throw new Error('Invalid source image path.');const bytes=await readFile(assetPath);const asset=await client.assets.upload('image',bytes,{filename:path.basename(assetPath)});const result={_type:'editorialImage',alt:image.alt,asset:{_type:'reference',_ref:asset._id}};imageCache.set(image.url,result);return result;}
async function singleton(id,type,fields){const existing=await client.getDocument(id);if(existing){console.log(`Preserved existing ${type}.`);return;}const doc={...fields,_id:id,_type:type};for(const key of ['heroImage','aboutImage','impactImage','supportImage'])if(doc[key])doc[key]=await upload(doc[key]);await client.createIfNotExists(doc);console.log(`Imported ${type}.`);}
await singleton('siteSettings','siteSettings',seed.settings);
await singleton('homePage','homePage',seed.home);
const mapping={programmes:'programme',projects:'project',stories:'story',reports:'report',partners:'partner'};
let imported=0,skipped=0;
for(const [collection,type] of Object.entries(mapping))for(const item of seed[collection]){
  const sourceKey=`canva:${type}:${item.slug||item.name}`;
  const existing=await client.fetch('*[_type==$type && sourceKey==$sourceKey][0]._id',{type,sourceKey});
  if(existing){skipped++;continue;}
  const doc={...item,_type:type,sourceKey};
  if(item.slug)doc.slug={_type:'slug',current:item.slug};
  if(item.image)doc.image=await upload(item.image);
  if(item.logo)doc.logo=await upload(item.logo);
  delete doc._id;
  // Sanity generates ordinary document IDs; sourceKey makes subsequent runs preserve them.
  await client.create(doc);imported++;
}
console.log(`Import complete: ${imported} new records, ${skipped} existing records preserved. Check counts and run Studio document validation before cutover.`);
