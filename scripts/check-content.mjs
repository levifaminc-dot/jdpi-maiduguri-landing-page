// Lightweight hourly check: no dependency installation or write access needed.
import {readFile} from 'node:fs/promises';
import catalogue from '../content/page-fields.json' with {type:'json'};
const settings=JSON.parse(await readFile('config/sanity.json','utf8'));
const types=['siteSettings','homePage','programme','project','story','report','partner',...catalogue.map(page=>page.type)];
const project=process.env.PUBLIC_SANITY_PROJECT_ID||settings.projectId;
const dataset=process.env.PUBLIC_SANITY_DATASET||settings.dataset;
const query='*[_type in $types && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(_id){_id,_rev}';
const url=new URL(`https://${project}.api.sanity.io/v2026-10-05/data/query/${dataset}`);
url.searchParams.set('query',query);
url.searchParams.set('$types',JSON.stringify(types));
url.searchParams.set('perspective','published');
const headers=process.env.SANITY_API_READ_TOKEN?{Authorization:`Bearer ${process.env.SANITY_API_READ_TOKEN}`}:{ };
const response=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`Sanity content check failed (${response.status}).`);
const {result}=await response.json();
let old=[];
try{old=(await readFile('content/documents.ndjson','utf8')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line)).filter(doc=>types.includes(doc._type)).map(({_id,_rev})=>({_id,_rev})).sort((a,b)=>a._id.localeCompare(b._id));}catch(error){if(error.code!=='ENOENT')throw error;}
const current=result.sort((a,b)=>a._id.localeCompare(b._id));
console.log(JSON.stringify(old)!==JSON.stringify(current)?'changed=true':'changed=false');
