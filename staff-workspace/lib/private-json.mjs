import {AccessError} from './membership.mjs';
export async function boundedJson(request,max=65536) {
  if(Number(request.headers.get('content-length'))>max) throw new AccessError(413,'Your message is too long.');
  const reader=request.body?.getReader();
  if(!reader) throw new AccessError(400,'Invalid request.');
  const chunks=[];let total=0;
  try {
    for(;;) {const {done,value}=await reader.read();if(done) break;total+=value.byteLength;if(total>max){await reader.cancel();throw new AccessError(413,'Your message is too long.');}chunks.push(value);}
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(total);let position=0;
  for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.byteLength;}
  try {return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));} catch {throw new AccessError(400,'Invalid request.');}
}
