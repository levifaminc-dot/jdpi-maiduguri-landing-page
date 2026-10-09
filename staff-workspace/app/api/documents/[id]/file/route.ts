import {requireActiveMember} from '../../../../../lib/workspace-access';
import {AccessError} from '../../../../../lib/membership.mjs';
import {readDocumentFile} from '../../../../../lib/documents.mjs';
import {privateStorage} from '../../../../../lib/private-storage.mjs';
import {microsoftConfig} from '../../../../../lib/microsoft-policy.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const config=microsoftConfig(process.env);
    if(!config || request.headers.get('host')!==new URL(config.origin).host)throw new AccessError(403,'Invalid request.');
    const {identity,pool}=await requireActiveMember(request.headers);const {id}=await params;
    const file=await readDocumentFile(pool,identity,id,privateStorage());
    return new Response(file.bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(file.bytes.length),'Content-Disposition':`attachment; filename="jdpi-document.pdf"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'",'Referrer-Policy':'no-referrer'}});
  } catch(error) {
    const status=error instanceof AccessError?error.status:503;
    return Response.json({error:error instanceof AccessError?error.message:'The private PDF is temporarily unavailable.'},{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
}
