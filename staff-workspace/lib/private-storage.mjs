import 'server-only';
import {put,get} from '@vercel/blob';
import {boundedBytes} from './private-bytes.mjs';
import {PDF_MAX_BYTES} from './document-policy.mjs';
export function privateStorage() {
  const token=process.env.BLOB_READ_WRITE_TOKEN;
  if(!token)return null;
  return {
    async put(pathname,bytes) {
      const result=await put(pathname,bytes,{access:'private',token,contentType:'application/pdf',addRandomSuffix:false,allowOverwrite:false,abortSignal:AbortSignal.timeout(20000)});
      if(result.pathname!==pathname)throw new Error('Unexpected storage response.');
    },
    async read(pathname) {
      const result=await get(pathname,{access:'private',token,abortSignal:AbortSignal.timeout(20000)});
      if(!result || result.statusCode!==200 || result.blob.pathname!==pathname)throw new Error('Private file unavailable.');
      return boundedBytes(result.stream,PDF_MAX_BYTES);
    },
  };
}
