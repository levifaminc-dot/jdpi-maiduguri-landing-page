import 'server-only';
import {verifiedIdentity} from './microsoft-policy.mjs';
import {AccessError,readMember,transaction} from './membership.mjs';
import {documentId} from './document-policy.mjs';
import {audienceDepartments} from './document-audiences.mjs';
async function actor(db,identity,exclusive=false){
  if(!verifiedIdentity(identity))throw new AccessError(401,'Please sign in with your JDPI account.');
  await db.query(`SELECT id FROM workspace_control WHERE id=1 ${exclusive?'FOR UPDATE':'FOR SHARE'}`);
  const member=await readMember(db,identity);if(member?.status!=='ACTIVE')throw new AccessError(403,'Active staff access is required.');
  const own=(await db.query('SELECT profile_editor FROM workspace_staff_profile WHERE tenant_id=$1 AND object_id=$2',[identity.tenantId,identity.objectId])).rows[0];
  return {...member,profileEditor:own?.profile_editor===true};
}
export async function staffDepartments(pool,identity){return transaction(pool,async db=>{const member=await actor(db,identity);return {canEdit:member.role==='ADMIN'||member.profileEditor,canAssignEditors:member.role==='ADMIN',people:(await db.query(`SELECT m.object_id AS id,m.name,COALESCE(p.department,'') AS department,COALESCE(p.profile_editor,false) AS "profileEditor",COALESCE(p.version,0) AS version FROM workspace_member m LEFT JOIN workspace_staff_profile p ON p.tenant_id=m.tenant_id AND p.object_id=m.object_id WHERE m.tenant_id=$1 AND m.status='ACTIVE' ORDER BY lower(m.name),m.object_id LIMIT 500`,[identity.tenantId])).rows};});}
export async function changeStaffDepartment(pool,identity,body){
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!['id','department','version','profileEditor'].includes(key))||!documentId(body.id)||!Number.isSafeInteger(body.version)||body.version<0||body.version>=2147483647||body.department!==''&&!audienceDepartments.includes(body.department)||'profileEditor' in body&&typeof body.profileEditor!=='boolean')throw new AccessError(400,'Check the department details.');
  return transaction(pool,async db=>{
    const member=await actor(db,identity,true);
    if(member.role!=='ADMIN'&&!member.profileEditor)throw new AccessError(403,'Only an administrator or profile editor can set departments.');
    if('profileEditor' in body&&member.role!=='ADMIN')throw new AccessError(403,'Only administrators can assign profile editors.');
    // Lock actor/target profiles in consistent order, preventing capability revocation races.
    const ids=[...new Set([identity.objectId,body.id])].sort();
    await db.query('SELECT object_id FROM workspace_member WHERE tenant_id=$1 AND object_id=ANY($2::uuid[]) ORDER BY object_id FOR UPDATE',[identity.tenantId,ids]);
    const fresh=await actor(db,identity);if(fresh.role!=='ADMIN'&&!fresh.profileEditor)throw new AccessError(403,'Profile editor access is no longer active.');
    const target=await readMember(db,{tenantId:identity.tenantId,objectId:body.id});if(target?.status!=='ACTIVE')throw new AccessError(404,'Approved staff member not found.');
    const previous=(await db.query('SELECT * FROM workspace_staff_profile WHERE tenant_id=$1 AND object_id=$2 FOR UPDATE',[identity.tenantId,body.id])).rows[0];
    if((previous?.version||0)!==body.version)throw new AccessError(409,'This profile changed. Reload the page.');
    const count=(await db.query(`INSERT INTO workspace_throttle(key,count,reset_at) VALUES ($1,1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN workspace_throttle.reset_at<=now() THEN 1 ELSE workspace_throttle.count+1 END,reset_at=CASE WHEN workspace_throttle.reset_at<=now() THEN now()+interval '1 minute' ELSE workspace_throttle.reset_at END RETURNING count`,[`${identity.objectId}:staff-departments`])).rows[0].count;if(count>20)throw new AccessError(429,'Please wait before making more profile changes.');
    await db.query(`INSERT INTO workspace_staff_profile(tenant_id,object_id,department,profile_editor) VALUES ($1,$2,$3,$4) ON CONFLICT(tenant_id,object_id) DO UPDATE SET department=EXCLUDED.department,profile_editor=EXCLUDED.profile_editor,version=workspace_staff_profile.version+1,updated_at=now()`,[identity.tenantId,body.id,body.department,'profileEditor' in body?body.profileEditor:previous?.profile_editor||false]);
    await db.query("INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES ($1,$2,'staff-department-updated',$3)",[identity.objectId,body.id,JSON.stringify({editorAccessChanged:'profileEditor' in body&&body.profileEditor!==!!previous?.profile_editor})]);
    return {id:body.id};
  });
}
