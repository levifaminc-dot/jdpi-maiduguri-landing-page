import {getPool} from '../../../lib/database.mjs';
import {microsoftConfig} from '../../../lib/microsoft-policy.mjs';
import {workspaceIdentity} from '../../../lib/workspace-access';
import {AccessError} from '../../../lib/membership.mjs';
import {boundedJson} from '../../../lib/private-json.mjs';
import {staffDirectory,staffProfile,changeStaffProfile} from '../../../lib/staff-directory.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function handle(request:Request){try{
  const config=microsoftConfig(process.env);if(!config)return reply({error:'Sign-in is not configured.'},503);
  if(request.headers.get('host')!==new URL(config.origin).host||request.method==='POST'&&(request.headers.get('origin')!==config.origin||!request.headers.get('content-type')?.startsWith('application/json')))return reply({error:'Invalid request.'},403);
  const identity=await workspaceIdentity(request.headers),pool=getPool();if(!pool)return reply({error:'Workspace is not connected.'},503);
  if(request.method==='POST')return reply(await changeStaffProfile(pool,identity,await boundedJson(request,4096)));
  const id=new URL(request.url).searchParams.get('id');return reply(id!==null?await staffProfile(pool,identity,id):await staffDirectory(pool,identity));
}catch(error){if(error instanceof AccessError)return reply({error:error.message},error.status);return reply({error:'Staff directory is temporarily unavailable.'},503);}}
export {handle as GET,handle as POST};
