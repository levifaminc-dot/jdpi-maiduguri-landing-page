import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {readFileSync} from 'node:fs';
const settings=JSON.parse(readFileSync('config/sanity.json','utf8'));
const compileOnly=!(process.env.SANITY_STUDIO_PROJECT_ID||settings.projectId);
// Local configuration sentinel for offline schema/type/build checks only. Never used by deployment or import scripts.
const env={...process.env,CI:'true',NO_UPDATE_NOTIFIER:'1',SANITY_STUDIO_PROJECT_ID:process.env.SANITY_STUDIO_PROJECT_ID||settings.projectId||'localverification',SANITY_STUDIO_DATASET:process.env.SANITY_STUDIO_DATASET||settings.dataset};
if(compileOnly)console.log('Verifying Studio locally without connecting or creating a Sanity project.');
const cli=path.resolve('node_modules/@sanity/cli/bin/run.js');
for(const args of [['schema','extract','--enforce-required-fields','--force'],['typegen','generate'],['build']]){
  const result=spawnSync(process.execPath,[cli,...args],{cwd:path.resolve('studio'),env,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
  if(args[0]==='schema'){
    const tests=spawnSync(process.execPath,['--test','scripts/content-structure.test.mjs'],{env,stdio:'inherit'});
    if(tests.error)throw tests.error;
    if(tests.status!==0)process.exit(tests.status||1);
    const structure=spawnSync(process.execPath,['scripts/validate-structure.mjs'],{env,stdio:'inherit'});
    if(structure.error)throw structure.error;
    if(structure.status!==0)process.exit(structure.status||1);
  }
}
