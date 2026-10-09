import {getAuth} from '../../../../lib/auth';
import {allowedAuthRequest, microsoftConfig} from '../../../../lib/microsoft-policy.mjs';
import {boundedAuthRequest} from '../../../../lib/auth-request.mjs';
import {AccessError} from '../../../../lib/membership.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const failure = (status:number) => Response.json({error:'Microsoft sign-in is unavailable. Please return to the sign-in page.'},{status, headers:{'Cache-Control':'private, no-store'}});

async function handler(request:Request) {
  const url = new URL(request.url);
  const path = url.pathname.slice('/api/auth'.length);
  if (!allowedAuthRequest(request.method, path)) return failure(404);
  const config = microsoftConfig(process.env);
  if (!config) return failure(503);
  // Next's local handler URL uses the bound server address (127.0.0.1), even
  // for localhost requests. Validate the actual Host and browser Origin; all
  // provider/callback URLs come from fixed config, never the internal URL.
  if (request.headers.get('host') !== new URL(config.origin).host) return failure(403);
  if (request.method === 'POST') {
    if (request.headers.get('origin') !== config.origin || !request.headers.get('content-type')?.startsWith('application/json')) return failure(403);
    try {
      // Bound the actual stream even without Content-Length. Do not tee/clone
      // an unbounded request or forward extra fields to the authentication SDK.
      request=await boundedAuthRequest(request,path);
    } catch(error) {return failure(error instanceof AccessError?error.status:400);}
  }
  try {
    const auth = getAuth();
    if (!auth) return failure(503);
    const response = await auth.handler(request);
    response.headers.set('Cache-Control','private, no-store');
    if (path === '/get-session' && response.ok) {
      const data = await response.json();
      // Never return the internal session token or provider credentials to JS.
      return Response.json(data ? {session:{expiresAt:data.session.expiresAt}, user:{name:data.user.name, tenantId:data.user.tenantId, objectId:data.user.objectId}} : null,{headers:response.headers});
    }
    return response;
  } catch {return failure(503);}
}
export {handler as GET, handler as POST};
