import {createClient} from '@sanity/client';
import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {RELEASE_QUERY} from '../src/lib/queries.ts';

const projectId=process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset=process.env.PUBLIC_SANITY_DATASET;
if(!projectId||!dataset)throw new Error('Provide PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET before taking a live snapshot.');
const client=createClient({projectId,dataset,apiVersion:'2026-10-05',useCdn:false,perspective:'published',token:process.env.SANITY_API_READ_TOKEN||undefined});
const {content:data,documents:editorialDocuments}=await client.fetch(RELEASE_QUERY);
if(!data.settings||!data.home)throw new Error('Publish JDPI Site settings and Homepage before taking a snapshot.');
const assetRefs=new Set();
function collectAssetRefs(value){if(Array.isArray(value))value.forEach(collectAssetRefs);else if(value&&typeof value==='object'){if(typeof value._ref==='string'&&/^(image|file)-/.test(value._ref))assetRefs.add(value._ref);Object.values(value).forEach(collectAssetRefs);}}
collectAssetRefs(editorialDocuments);
// Export only assets referenced by published website documents, never unused draft uploads.
const assets=assetRefs.size ? await client.getDocuments([...assetRefs].sort()) : [];
if(assets.some(asset=>!asset))throw new Error('A published document references a missing asset.');
const documents=[...editorialDocuments,...assets].sort((a,b)=>a._id.localeCompare(b._id));
const urlMap=new Map();
const manifest=[];
await mkdir('public/assets/sanity',{recursive:true});
for(const asset of assets){
  if(!/^(image|file)-[a-zA-Z0-9-]+$/.test(asset._id))throw new Error('Invalid asset identifier.');
  const url=new URL(asset.url);
  if(url.origin!=='https://cdn.sanity.io')throw new Error('Unexpected asset origin.');
  const ext=String(asset.extension||'bin').replace(/[^a-zA-Z0-9]/g,'');
  const local=`/assets/sanity/${asset._id}.${ext}`;
  const destination=path.join('public',local.slice(1));
  try{await access(destination);}catch{const response=await fetch(url);if(!response.ok)throw new Error(`Asset export failed: ${response.status}`);await writeFile(destination,Buffer.from(await response.arrayBuffer()));}
  const bytes=await readFile(destination);
  if(asset.sha1hash&&createHash('sha1').update(bytes).digest('hex')!==asset.sha1hash)throw new Error(`Asset checksum failed: ${asset._id}`);
  manifest.push({id:asset._id,originalUrl:asset.url,path:local,sha256:createHash('sha256').update(bytes).digest('hex')});
  urlMap.set(asset.url,local);
}
function localise(value){if(Array.isArray(value))return value.map(localise);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,localise(v)]));if(typeof value==='string'&&urlMap.has(value))return urlMap.get(value);return value;}
// Revisions and timestamps remain in the raw export for faithful recovery; the rendered snapshot is deterministic.
await mkdir('content',{recursive:true});
await writeFile('content/snapshot.json',JSON.stringify(localise(data),null,2)+'\n');
await writeFile('content/documents.ndjson',documents.map(doc=>JSON.stringify(doc)).join('\n')+'\n');
await writeFile('content/assets.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Saved ${documents.length} published documents and ${assets.length} assets from ${dataset}.`);
