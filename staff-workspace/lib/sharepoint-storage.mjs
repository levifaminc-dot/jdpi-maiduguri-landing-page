import 'server-only';
import {SHAREPOINT_TARGET as target} from './sharepoint-target.mjs';
import {PDF_MAX_BYTES} from './document-policy.mjs';
import {boundedBytes} from './private-bytes.mjs';

const graph='https://graph.microsoft.com/v1.0';
const safeError=()=>new Error('Private SharePoint storage is temporarily unavailable.');
function stagedError(cause,stage) {
  const error=safeError();error.stage=stage;
  if(Number.isInteger(cause?.status))error.status=cause.status;
  return error;
}
// Never put signed transfer URLs, bearer tokens or provider error bodies in logs.
function transferUrl(value) {
  try {
    const url=new URL(value);
    if(url.protocol!=='https:' || url.hostname!==target.hostname || url.port || url.username || url.password || url.hash)throw safeError();
    return url.href;
  }catch{throw safeError();}
}
function fileName(pathname) {
  const match=new RegExp(`^staff-pdfs/${target.tenantId}/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.pdf$`).exec(pathname);
  if(!match)throw safeError();
  return `${match[1]}.pdf`;
}
async function smallJson(response) {
  if(!response.ok){const error=safeError();error.status=response.status;throw error;}
  try{return JSON.parse(new TextDecoder().decode(await boundedBytes(response.body,65536)));}catch{throw safeError();}
}
export function sharepointStorage(env=process.env,fetcher=fetch,now=Date.now) {
  if(env.MICROSOFT_TENANT_ID!==target.tenantId || env.MICROSOFT_CLIENT_ID!==target.clientId || typeof env.MICROSOFT_CLIENT_SECRET!=='string' || env.MICROSOFT_CLIENT_SECRET.length<20)return null;
  let cached=null,pending=null;
  async function token(signal) {
    if(cached && cached.expires>now()+120000)return cached.value;
    if(!pending)pending=(async()=>{
      const response=await fetcher(`https://login.microsoftonline.com/${target.tenantId}/oauth2/v2.0/token`,{
        method:'POST',redirect:'error',cache:'no-store',signal,
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams({client_id:target.clientId,client_secret:env.MICROSOFT_CLIENT_SECRET,scope:'https://graph.microsoft.com/.default',grant_type:'client_credentials'}),
      });
      const data=await smallJson(response);
      if(data.token_type!=='Bearer' || typeof data.access_token!=='string' || !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in)<180)throw safeError();
      cached={value:data.access_token,expires:now()+Number(data.expires_in)*1000};return cached.value;
    })().finally(()=>{pending=null;});
    return pending;
  }
  async function request(path,options,signal) {
    return fetcher(`${graph}${path}`,{...options,redirect:'manual',cache:'no-store',signal,headers:{...options?.headers,Authorization:`Bearer ${await token(signal)}`}});
  }
  const drive=`/drives/${encodeURIComponent(target.driveId)}`;
  function reference() {return {provider:target.provider,siteId:target.siteId,driveId:target.driveId};}
  function validReference(ref) {
    if(!ref || ref.provider!==target.provider || ref.siteId!==target.siteId || ref.driveId!==target.driveId)throw safeError();
  }
  return {
    reference,
    // Read-only connectivity check; no content enumeration or file creation.
    async verify() {
      const signal=AbortSignal.timeout(15000);
      let stage='application-token';
      try {
        await token(signal);
        stage='selected-site';
        const site=await smallJson(await request(`/sites/${encodeURIComponent(target.siteId)}?$select=id,webUrl`,{},signal));
        stage='document-library';
        const library=await smallJson(await request(`${drive}?$select=id,driveType,webUrl`,{},signal));
        stage='target-verification';
        if(site.id!==target.siteId || site.webUrl!==`https://${target.hostname}/sites/JDPIStaffDocuments` || library.id!==target.driveId || library.driveType!=='documentLibrary' || new URL(library.webUrl).hostname!==target.hostname)throw safeError();
        return true;
      }catch(cause){throw stagedError(cause,stage);}
    },
    async put(pathname,bytes,ref=reference()) {
      validReference(ref);const name=fileName(pathname);
      if(!(bytes instanceof Uint8Array) || bytes.length<16 || bytes.length>PDF_MAX_BYTES)throw safeError();
      const signal=AbortSignal.timeout(30000);
      let stage='resolve-library-root';
      try {
      const root=await smallJson(await request(`${drive}/root?$select=id`,{},signal));
      if(typeof root.id!=='string' || !/^[A-Za-z0-9_-]{10,200}$/.test(root.id))throw safeError();
      stage='create-upload-session';
      // Explicit fail-on-conflict upload session: never replace an existing file.
      const session=await smallJson(await request(`${drive}/items/${encodeURIComponent(root.id)}:/${name}:/createUploadSession`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({item:{'@microsoft.graph.conflictBehavior':'fail'}}),
      },signal));
      stage='validate-transfer-host';
      const uploadUrl=transferUrl(session.uploadUrl);
      const expiry=Date.parse(session.expirationDateTime);
      if(!Number.isFinite(expiry) || expiry<=now())throw safeError();
      // The signed URL stays server-side. Do NOT forward Graph authorization.
      stage='transfer-pdf';
      const response=await fetcher(uploadUrl,{method:'PUT',redirect:'error',cache:'no-store',signal,
        headers:{'Content-Type':'application/pdf','Content-Length':String(bytes.length),'Content-Range':`bytes 0-${bytes.length-1}/${bytes.length}`},body:bytes});
      // Microsoft documents both 200 and 201 on session completion. Conflict
      // protection is the explicit fail setting, not the response status alone.
      if(![200,201].includes(response.status)){const error=safeError();error.status=response.status;throw error;}
      stage='verify-upload-result';
      const item=await smallJson(response);
      if(item.name!==name || item.size!==bytes.length || !item.file || item.parentReference?.driveId!==target.driveId)throw safeError();
      }catch(cause){throw stagedError(cause,stage);}
    },
    async read(pathname,ref=reference()) {
      validReference(ref);const name=fileName(pathname),signal=AbortSignal.timeout(25000);
      let response=await request(`${drive}/root:/${name}:/content`,{},signal);
      if(response.status===302) {
        const downloadUrl=transferUrl(response.headers.get('location'));
        response=await fetcher(downloadUrl,{method:'GET',redirect:'error',cache:'no-store',signal});
      }
      if(response.status!==200){const error=safeError();error.status=response.status;throw error;}
      if(Number(response.headers.get('content-length'))>PDF_MAX_BYTES)throw safeError();
      return boundedBytes(response.body,PDF_MAX_BYTES);
    },
  };
}
