// Compare known local secret values against release text; print counts only.
// Never print credentials or matched lines. This is not a complete history scan.
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {parseEnv} from 'node:util';
const sibling=path.resolve('../jdpi-landing');
const values=new Set();
for(const file of [path.join(sibling,'.env'),path.join(sibling,'studio/.env'),path.join(sibling,'staff-workspace/.env.local'),path.join(sibling,'staff-workspace/.env.runtime.local')]){
  try{for(const [key,value] of Object.entries(parseEnv(await readFile(file,'utf8'))))if(/SECRET|TOKEN|DATABASE.*URL/.test(key) && value.length>=20)values.add(value);}catch{}
}
let scanned=0,matched=0;
async function walk(directory){
  let files;try{files=await readdir(directory,{withFileTypes:true});}catch{return;}
  for(const file of files){
    if(file.isSymbolicLink() || ['node_modules','.git','cache','.env.local','.env.runtime.local'].includes(file.name))continue;
    const target=path.join(directory,file.name);
    if(file.isDirectory())await walk(target);
    else if(/\.(?:html|js|mjs|json|css|map|ts|tsx|astro|ndjson)$/.test(file.name)){
      const text=await readFile(target,'utf8');scanned++;
      if([...values].some(secret=>text.includes(secret)))matched++;
    }
  }
}
await walk(path.resolve('dist'));await walk(path.resolve('studio/dist'));await walk(path.join(sibling,'staff-workspace/.next'));
console.log(JSON.stringify({knownSecretValuesChecked:values.size,releaseTextFilesChecked:scanned,filesMatchingKnownSecrets:matched}));
if(!values.size || !scanned || matched)process.exitCode=1;
