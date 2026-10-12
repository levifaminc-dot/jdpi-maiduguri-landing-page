import {getPool} from '../../../lib/database.mjs';
import {microsoftConfig} from '../../../lib/microsoft-policy.mjs';
import {workspaceIdentity} from '../../../lib/workspace-access';
import {AccessError} from '../../../lib/membership.mjs';
import {boundedJson} from '../../../lib/private-json.mjs';
import {eligibleTagStaff,readStaffTags,changeStaffTags} from '../../../lib/staff-tags.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function handle(request:Request){
  try{
    const config=microsoftConfig(process.env);
    if(!config)return reply({error:'Sign-in is not configured.'},503);
    if(request.headers.get('host')!==new URL(config.origin).host)return reply({error:'Invalid request.'},403);
    if(request.method==='POST'&&(request.headers.get('origin')!==config.origin||!request.headers.get('content-type')?.startsWith('application/json')))return reply({error:'Invalid request.'},403);
    const identity=await workspaceIdentity(request.headers);
    if(process.env.STAFF_TAGGING_ENABLED!=='true')return reply({error:'Staff tagging has not been enabled yet.'},503);
    const pool=getPool();if(!pool)return reply({error:'Workspace content is not connected.'},503);
    if(request.method==='POST')return reply(await changeStaffTags(pool,identity,await boundedJson(request,2048)));
    const params=new URL(request.url).searchParams;
    if(params.has('id'))return reply(await readStaffTags(pool,identity,{id:params.get('id'),kind:params.get('kind')}));
    return reply(await eligibleTagStaff(pool,identity));
  }catch(error){if(error instanceof AccessError)return reply({error:error.message},error.status);return reply({error:'Colleague tags are temporarily unavailable. Please try again.'},503);}
}
export {handle as GET,handle as POST};
