import {AccessError} from './membership.mjs';
export async function boundedBytes(stream,max) {
  if(!stream) throw new AccessError(400,'No file was received.');
  const reader=stream.getReader(),chunks=[];let size=0;
  try {
    for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new AccessError(413,'This file is too large. The maximum PDF size is 3 MB.');}chunks.push(value);}
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(size);let cursor=0;for(const part of chunks){bytes.set(part,cursor);cursor+=part.length;}return bytes;
}
