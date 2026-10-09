import 'server-only';
import {Worker} from 'node:worker_threads';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {AccessError} from './membership.mjs';
import {PDF_MAX_BYTES} from './document-policy.mjs';
export async function validatePdf(bytes) {
  if(!(bytes instanceof Uint8Array) || bytes.length<16 || bytes.length>PDF_MAX_BYTES) throw new AccessError(413,'Choose a PDF no larger than 3 MB.');
  if(!/^%PDF-(1\.[0-7]|2\.0)/.test(Buffer.from(bytes.subarray(0,12)).toString('ascii')) || !Buffer.from(bytes.subarray(Math.max(0,bytes.length-1024))).includes(Buffer.from('%%EOF'))) throw new AccessError(400,'This file does not contain a valid PDF.');
  const workerPath=[path.join(process.cwd(),'lib/pdf-validation-worker.mjs'),path.join(process.cwd(),'staff-workspace/lib/pdf-validation-worker.mjs')].find(existsSync);
  if(!workerPath)throw new AccessError(503,'PDF validation is temporarily unavailable. No file has been shared.');
  return new Promise((resolve,reject)=>{
    // Isolate untrusted parsing; no network, execution of PDF actions or file writes.
    const worker=new Worker(workerPath,{workerData:bytes,execArgv:[],resourceLimits:{maxOldGenerationSizeMb:96,maxYoungGenerationSizeMb:16}});
    let settled=false;
    const finish=result=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();if(result?.ok && Number.isInteger(result.pages))resolve(result.pages);else reject(new AccessError(400,'This PDF is damaged, encrypted, too complex or contains unsupported active content. Export a standard PDF without scripts or attachments.'));};
    const timer=setTimeout(()=>finish(null),8000);
    worker.once('message',finish);worker.once('error',()=>finish(null));worker.once('exit',()=>finish(null));
  });
}
