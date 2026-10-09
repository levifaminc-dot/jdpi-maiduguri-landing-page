import {boundedJson} from './private-json.mjs';
import {AccessError} from './membership.mjs';
import {validSignInBody} from './microsoft-policy.mjs';
// Called only after the route's fixed Host/Origin/method checks.
export async function boundedAuthRequest(request,path){
  const body=await boundedJson(request,2048);
  const valid=path==='/sign-in/social' ? validSignInBody(body) : path==='/sign-out' && body && typeof body==='object' && !Array.isArray(body) && Object.keys(body).length===0;
  if(!valid)throw new AccessError(400,'Invalid authentication request.');
  const headers=new Headers(request.headers);
  headers.delete('content-length');headers.delete('transfer-encoding');
  return new Request(request.url,{method:request.method,headers,body:JSON.stringify(body)});
}
