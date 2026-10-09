import {getPool} from '../../../lib/database.mjs';
import {microsoftConfig} from '../../../lib/microsoft-policy.mjs';
import {workspaceIdentity} from '../../../lib/workspace-access';
import {AccessError, adminOverview, changeMember, requestAccess, acceptInvitation} from '../../../lib/membership.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request) {
  try {
    const config=microsoftConfig(process.env);
    if(!config) return reply({error:'Sign-in is not configured.'},503);
    if(request.headers.get('host')!==new URL(config.origin).host) return reply({error:'Invalid request.'},403);
    if(request.method==='POST' && (request.headers.get('origin')!==config.origin || !request.headers.get('content-type')?.startsWith('application/json'))) return reply({error:'Invalid request.'},403);
    // Authenticate even when DB is unconfigured; never expose a directory publicly.
    const identity=await workspaceIdentity(request.headers);
    const pool=getPool();
    if(!pool) return reply({error:'The membership database is not connected yet.'},503);
    if(request.method==='GET') return reply(await adminOverview(pool,identity));
    if(Number(request.headers.get('content-length'))>2048) return reply({error:'Request too large.'},413);
    const text=await request.text();
    if(text.length>2048) return reply({error:'Request too large.'},413);
    let body;
    try {body=JSON.parse(text);} catch {return reply({error:'Invalid request.'},400);}
    if(body && typeof body==='object' && !Array.isArray(body) && Object.keys(body).length===1) {
      if(body.action==='request') return reply({member:await requestAccess(pool,identity)});
      if(body.action==='accept') return reply({member:await acceptInvitation(pool,identity)});
    }
    return reply({member:await changeMember(pool,identity,body)});
  } catch(error) {
    if(error instanceof AccessError) return reply({error:error.message},error.status);
    // Never log raw database/provider errors (connection strings/private data).
    return reply({error:'Workspace access is temporarily unavailable.'},503);
  }
}
export {handle as GET, handle as POST};
