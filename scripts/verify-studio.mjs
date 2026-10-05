import {spawnSync} from 'node:child_process';
import path from 'node:path';
const compileOnly=!process.env.SANITY_STUDIO_PROJECT_ID;
// Local configuration sentinel for offline schema/type/build checks only. Never used by deployment or import scripts.
const env={...process.env,CI:'true',NO_UPDATE_NOTIFIER:'1',SANITY_STUDIO_PROJECT_ID:process.env.SANITY_STUDIO_PROJECT_ID||'localverification',SANITY_STUDIO_DATASET:process.env.SANITY_STUDIO_DATASET||'production'};
if(compileOnly)console.log('Verifying Studio locally without connecting or creating a Sanity project.');
const cli=path.resolve('node_modules/@sanity/cli/bin/run.js');
for(const args of [['schema','extract','--enforce-required-fields'],['typegen','generate'],['build']]){
  const result=spawnSync(process.execPath,[cli,...args],{cwd:path.resolve('studio'),env,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
