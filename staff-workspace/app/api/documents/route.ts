import {getPool} from '../../../lib/database.mjs';
import {microsoftConfig} from '../../../lib/microsoft-policy.mjs';
import {requireActiveMember} from '../../../lib/workspace-access';
import {AccessError} from '../../../lib/membership.mjs';
import {documentFeed,uploadDocument,changeDocument} from '../../../lib/documents.mjs';
import {privateStorage} from '../../../lib/private-storage.mjs';
import {boundedJson} from '../../../lib/private-json.mjs';
import {boundedBytes} from '../../../lib/private-bytes.mjs';
import {PDF_MAX_BYTES} from '../../../lib/document-policy.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function handle(request:Request) {
  try {
    const config=microsoftConfig(process.env);
    if(!config)return reply({error:'Sign-in is not configured.'},503);
    if(request.headers.get('host')!==new URL(config.origin).host || (request.method==='POST' && request.headers.get('origin')!==config.origin))return reply({error:'Invalid request.'},403);
    const {identity}=await requireActiveMember(request.headers);const pool=getPool();
    if(request.method==='GET') {
      const search=new URL(request.url).searchParams;
      return reply(await documentFeed(pool,identity,{view:search.get('view')||'library',folder:search.get('folder')||'',query:search.get('q')||'',offset:Number(search.get('offset')||'0')}));
    }
    const type=request.headers.get('content-type')||'';
    if(type.startsWith('application/json'))return reply(await changeDocument(pool,identity,await boundedJson(request)));
    if(!type.startsWith('multipart/form-data;'))return reply({error:'Choose a PDF using the upload form.'},400);
    const storage=privateStorage();if(!storage)return reply({error:'Private document storage is not connected yet. Nothing has been uploaded.'},503);
    if(Number(request.headers.get('content-length'))>PDF_MAX_BYTES+32768)return reply({error:'The maximum PDF size is 3 MB.'},413);
    const bytes=await boundedBytes(request.body,PDF_MAX_BYTES+32768);
    let form:FormData;try{form=await new Request('http://localhost',{method:'POST',headers:{'Content-Type':type},body:bytes}).formData();}catch{return reply({error:'The upload could not be read. Choose the file again.'},400);}
    const allowed=['id','title','description','folder','file'];
    if([...form.keys()].some(key=>!allowed.includes(key)) || allowed.some(key=>form.getAll(key).length!==1))return reply({error:'Invalid upload fields.'},400);
    const file=form.get('file');
    if(!(file instanceof File) || !['','application/pdf','application/octet-stream'].includes(file.type) || file.size>PDF_MAX_BYTES)return reply({error:'Choose a PDF no larger than 3 MB.'},400);
    return reply(await uploadDocument(pool,identity,{id:form.get('id'),title:form.get('title'),description:form.get('description'),folder:form.get('folder'),filename:file.name},new Uint8Array(await file.arrayBuffer()),storage));
  } catch(error) {
    if(error instanceof AccessError)return reply({error:error.message},error.status);
    return reply({error:'Documents are temporarily unavailable. Please try again.'},503);
  }
}
export {handle as GET,handle as POST};
