import {createHash,randomBytes} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {requireActiveMember} from '../../../../lib/workspace-access';
import {plannerConfig,plannerCookieOptions,plannerStateCookieName} from '../../../../lib/planner';
import {sealPlanner} from '../../../../lib/planner-seal.mjs';

export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
  const config=plannerConfig();
  if (!config) return new Response('Planner pilot is not enabled.',{status:404});
  if (request.nextUrl.origin!==config.origin) return new Response('Invalid workspace origin.',{status:400});
  let identity;
  try {({identity}=await requireActiveMember(request.headers));} catch {return NextResponse.redirect(new URL('/',config.origin));}
  const state=randomBytes(32).toString('base64url');
  const verifier=randomBytes(32).toString('base64url');
  const nonce=randomBytes(32).toString('base64url');
  const challenge=createHash('sha256').update(verifier).digest('base64url');
  const redirectUri=`${config.origin}/api/planner/callback`;
  const url=new URL(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`);
  url.search=new URLSearchParams({client_id:config.clientId,response_type:'code',redirect_uri:redirectUri,
    response_mode:'query',scope:'openid profile email Tasks.Read',state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();
  const response=NextResponse.redirect(url);
  response.cookies.set(plannerStateCookieName(config.origin),sealPlanner({state,verifier,nonce,oid:identity.objectId,issued:Date.now()},config.secret),plannerCookieOptions(config.origin,600));
  response.headers.set('Cache-Control','no-store');
  return response;
}
