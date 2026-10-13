import {createRemoteJWKSet,jwtVerify} from 'jose';
import {NextRequest,NextResponse} from 'next/server';
import {requireActiveMember} from '../../../../lib/workspace-access';
import {plannerConfig,plannerCookieOptions,plannerStateCookieName,plannerTicketCookieNames} from '../../../../lib/planner';
import {openPlanner,sealPlanner,splitPlannerTicket} from '../../../../lib/planner-seal.mjs';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  const config=plannerConfig();
  if (!config) return new Response('Planner pilot is not enabled.',{status:404});
  if (request.nextUrl.origin!==config.origin) return new Response('Invalid workspace origin.',{status:400});
  const failure=()=>NextResponse.redirect(new URL('/workspace/tasks?connection=failed',config.origin));
  const stateCookie=plannerStateCookieName(config.origin);
  const state=openPlanner(request.cookies.get(stateCookie)?.value,config.secret);
  const stateParam=request.nextUrl.searchParams.get('state');
  const code=request.nextUrl.searchParams.get('code');
  const result=failure();
  result.cookies.set(stateCookie,'',{...plannerCookieOptions(config.origin,0),expires:new Date(0)});
  if (!state || typeof state.state!=='string' || stateParam!==state.state || !code || code.length>4096 ||
      typeof state.verifier!=='string' || typeof state.nonce!=='string' ||
      !Number.isSafeInteger(state.issued) || Date.now()-state.issued>600_000 || state.issued>Date.now()+30_000) return result;
  let identity;
  try {({identity}=await requireActiveMember(request.headers));} catch {return result;}
  if (state.oid!==identity.objectId) return result;
  try {
    const tokenResponse=await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10_000),
      body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,grant_type:'authorization_code',
        code,redirect_uri:`${config.origin}/api/planner/callback`,code_verifier:state.verifier})});
    if (!tokenResponse.ok) return result;
    const tokens=await tokenResponse.json();
    if (typeof tokens.id_token!=='string' || typeof tokens.access_token!=='string' || tokens.access_token.length>3000 ||
        !Number.isFinite(Number(tokens.expires_in))) return result;
    const issuer=`https://login.microsoftonline.com/${config.tenantId}/v2.0`;
    const jwks=createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`),{timeoutDuration:5000});
    const {payload}=await jwtVerify(tokens.id_token,jwks,{issuer,audience:config.clientId,algorithms:['RS256']});
    if (payload.nonce!==state.nonce || payload.tid!==identity.tenantId || payload.oid?.toString().toLowerCase()!==identity.objectId) return result;
    const seconds=Math.min(3600,Math.max(0,Math.floor(Number(tokens.expires_in))-60));
    if (seconds<60) return result;
    const ticket=sealPlanner({oid:identity.objectId,tenant:identity.tenantId,token:tokens.access_token,expires:Date.now()+seconds*1000},config.secret);
    const parts=splitPlannerTicket(ticket);
    if (!parts) return result;
    const response=NextResponse.redirect(new URL('/workspace/tasks',config.origin));
    response.cookies.set(stateCookie,'',{...plannerCookieOptions(config.origin,0),expires:new Date(0)});
    const [firstName,secondName]=plannerTicketCookieNames(config.origin);
    response.cookies.set(firstName,parts[0],plannerCookieOptions(config.origin,seconds));
    if (parts[1]) response.cookies.set(secondName,parts[1],plannerCookieOptions(config.origin,seconds));
    else response.cookies.set(secondName,'',{...plannerCookieOptions(config.origin,0),expires:new Date(0)});
    response.headers.set('Cache-Control','no-store');
    return response;
  } catch {return result;}
}
