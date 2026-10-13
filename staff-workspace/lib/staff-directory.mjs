import 'server-only';
import {verifiedIdentity} from './microsoft-policy.mjs';
import {AccessError,readMember,transaction} from './membership.mjs';
import {applyProfileChanges,ProfilePolicyError} from './profile-policy.mjs';
import {documentId} from './document-policy.mjs';
import {audienceDepartments} from './document-audiences.mjs';

async function actor(db,identity,exclusive=false){
  if(!verifiedIdentity(identity))throw new AccessError(401,'Please sign in with your JDPI account.');
  // Same lock as admission, suspension, department edits and PDF authorization.
  await db.query(`SELECT id FROM workspace_control WHERE id=1 ${exclusive?'FOR UPDATE':'FOR SHARE'}`);
  const member=await readMember(db,identity);if(member?.status!=='ACTIVE')throw new AccessError(403,'Active staff access is required.');
  const profile=(await db.query('SELECT profile_editor FROM workspace_staff_profile WHERE tenant_id=$1 AND object_id=$2',[identity.tenantId,identity.objectId])).rows[0];
  return {...member,objectId:identity.objectId,profileEditor:profile?.profile_editor===true};
}
const professionalSelect=`SELECT m.object_id AS id,COALESCE(NULLIF(p.display_name,''),m.name) AS name,
  COALESCE(p.work_email,'') AS email,COALESCE(p.job_title,'') AS title,COALESCE(p.department,'') AS department,
  COALESCE(p.office,'') AS office,COALESCE(p.work_state,'') AS state,COALESCE(p.introduction,'') AS bio,
  COALESCE(p.version,0) AS version FROM workspace_member m LEFT JOIN workspace_staff_profile p
  ON p.tenant_id=m.tenant_id AND p.object_id=m.object_id WHERE m.tenant_id=$1 AND m.status='ACTIVE'`;
const dto=row=>({id:row.id,name:row.name,email:row.email,title:row.title,department:row.department,office:row.office,state:row.state,bio:row.bio,version:row.version,issues:[]});
async function detail(db,identity,id){
  const row=(await db.query(`${professionalSelect} AND m.object_id=$2`,[identity.tenantId,id])).rows[0];
  if(!row)throw new AccessError(404,'Approved staff member not found.');
  const profile=dto(row);
  // Never SELECT another person's private fields, even for an administrator/editor.
  if(id.toLowerCase()===identity.objectId.toLowerCase()){
    const own=(await db.query('SELECT phone,home_address,version FROM workspace_staff_private_profile WHERE tenant_id=$1 AND object_id=$2',[identity.tenantId,id])).rows[0];
    Object.assign(profile,{phone:own?.phone||'',homeAddress:own?.home_address||'',privateVersion:own?.version||0});
  }
  return profile;
}
export async function staffDirectory(pool,identity){return transaction(pool,async db=>{
  const member=await actor(db,identity);
  const people=(await db.query(`${professionalSelect} ORDER BY lower(COALESCE(NULLIF(p.display_name,''),m.name)),m.object_id LIMIT 500`,[identity.tenantId])).rows.map(dto);
  return {people,actor:{objectId:identity.objectId,role:member.role,status:'ACTIVE',profileEditor:member.profileEditor}};
});}
export async function staffProfile(pool,identity,id){
  if(!documentId(id))throw new AccessError(400,'Choose a valid staff profile.');
  return transaction(pool,async db=>{await actor(db,identity);return detail(db,identity,id);});
}
export async function changeStaffProfile(pool,identity,body){
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['id','version','privateVersion','patch'].includes(k))||!documentId(body.id)||!Number.isSafeInteger(body.version)||body.version<0||body.version>=2147483647||!Number.isSafeInteger(body.privateVersion??0)||(body.privateVersion??0)<0||(body.privateVersion??0)>=2147483647)throw new AccessError(400,'Check your profile details.');
  return transaction(pool,async db=>{
    const member=await actor(db,identity,true),previous=await detail(db,identity,body.id);
    let updated;try{updated=applyProfileChanges(member,previous,body.patch);}catch(error){if(error instanceof ProfilePolicyError)throw new AccessError(error.status,error.message);throw error;}
    if('department' in body.patch&&updated.department!==''&&!audienceDepartments.includes(updated.department))throw new AccessError(400,'Choose an approved department.');
    const keys=Object.keys(body.patch),publicChange=keys.some(k=>!['phone','homeAddress','phoneShared'].includes(k)),privateChange=keys.some(k=>['phone','homeAddress','phoneShared'].includes(k));
    if(publicChange&&previous.version!==body.version||privateChange&&previous.privateVersion!==(body.privateVersion??0))throw new AccessError(409,'This profile changed. Close and reopen it before saving.');
    const count=(await db.query(`INSERT INTO workspace_throttle(key,count,reset_at) VALUES ($1,1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN workspace_throttle.reset_at<=now() THEN 1 ELSE workspace_throttle.count+1 END,reset_at=CASE WHEN workspace_throttle.reset_at<=now() THEN now()+interval '1 minute' ELSE workspace_throttle.reset_at END RETURNING count`,[`${identity.objectId}:staff-profile`])).rows[0].count;
    if(count>20)throw new AccessError(429,'Please wait before making more profile changes.');
    if(publicChange)await db.query(`INSERT INTO workspace_staff_profile(tenant_id,object_id,display_name,work_email,job_title,department,office,work_state,introduction)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(tenant_id,object_id) DO UPDATE SET
      display_name=EXCLUDED.display_name,work_email=EXCLUDED.work_email,job_title=EXCLUDED.job_title,department=EXCLUDED.department,
      office=EXCLUDED.office,work_state=EXCLUDED.work_state,introduction=EXCLUDED.introduction,version=workspace_staff_profile.version+1,updated_at=now()`,
      [identity.tenantId,body.id,updated.name,updated.email,updated.title,updated.department,updated.office,updated.state,updated.bio]);
    if(privateChange)await db.query(`INSERT INTO workspace_staff_private_profile(tenant_id,object_id,phone,home_address) VALUES ($1,$2,$3,$4)
      ON CONFLICT(tenant_id,object_id) DO UPDATE SET phone=EXCLUDED.phone,home_address=EXCLUDED.home_address,version=workspace_staff_private_profile.version+1,updated_at=now()`,[identity.tenantId,body.id,updated.phone||'',updated.homeAddress||'']);
    // Record only field categories, not addresses, phone numbers or profile text.
    await db.query("INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES ($1,$2,'staff-profile-updated',$3)",[identity.objectId,body.id,JSON.stringify({professional:publicChange,personal:privateChange})]);
    return detail(db,identity,body.id);
  });
}
