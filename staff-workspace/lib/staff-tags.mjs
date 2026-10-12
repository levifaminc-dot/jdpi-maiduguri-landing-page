import 'server-only';
import {verifiedIdentity} from './microsoft-policy.mjs';
import {AccessError,readMember,transaction} from './membership.mjs';
import {staffSharingEnabled,validDocumentAudience,canReadDocument,validateRecipients} from './document-audiences.mjs';
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const types={announcement:{table:'workspace_announcement',owner:'author_object_id',tags:'workspace_announcement_tag',visible:'PUBLISHED',editable:['DRAFT','PUBLISHED']},document:{table:'workspace_document',owner:'uploader_object_id',tags:'workspace_document_tag',visible:'READY',editable:['READY']}};
const kindConfig=kind=>typeof kind==='string'&&Object.hasOwn(types,kind)?types[kind]:null;
export function validTagAction(body){return !!body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).every(key=>['kind','id','version','staffIds',...(body.kind==='document'&&staffSharingEnabled()?['sharingMode','departments']:[])].includes(key))&&!!kindConfig(body.kind)&&uuid(body.id)&&Number.isSafeInteger(body.version)&&body.version>0&&body.version<2147483647&&Array.isArray(body.staffIds)&&body.staffIds.length<=10&&body.staffIds.every(uuid)&&new Set(body.staffIds.map(id=>id.toLowerCase())).size===body.staffIds.length&&(body.kind!=='document'||!staffSharingEnabled()||validDocumentAudience(body));}
async function active(db,identity){
  if(!verifiedIdentity(identity))throw new AccessError(401,'Please sign in with your JDPI account.');
  await db.query('SELECT id FROM workspace_control WHERE id=1 FOR SHARE');
  const actor=await readMember(db,identity);
  if(actor?.status!=='ACTIVE')throw new AccessError(403,'Active staff access is required.');
  return actor;
}
async function resource(db,identity,actor,kind,id,lock=false){
  const config=kindConfig(kind);
  if(!config||!uuid(id))throw new AccessError(400,'Invalid staff tagging request.');
  // The only interpolated identifiers come from the fixed allowlist above.
  const row=(await db.query(`SELECT *,${config.owner} AS owner FROM ${config.table} WHERE tenant_id=$1 AND id=$2${lock?' FOR UPDATE':' FOR SHARE'}`,[identity.tenantId,id])).rows[0];
  if(!row||row.status!==config.visible&&actor.role!=='ADMIN'&&row.owner!==identity.objectId)throw new AccessError(404,'This resource is not available.');
  if(kind==='document'&&!await canReadDocument(db,identity,actor,row))throw new AccessError(404,'This resource is not available.');
  return {config,row,canManage:config.editable.includes(row.status)&&(actor.role==='ADMIN'||row.owner===identity.objectId&&!row.moderated)};
}
async function tags(db,identity,config,id){
  // Suspended recipients disappear from labels and from selectable colleagues.
  return (await db.query(`SELECT m.object_id AS id,m.name FROM ${config.tags} t JOIN workspace_member m ON m.tenant_id=t.tenant_id AND m.object_id=t.staff_object_id WHERE t.tenant_id=$1 AND t.resource_id=$2 AND m.status='ACTIVE' ORDER BY lower(m.name),m.object_id LIMIT 10`,[identity.tenantId,id])).rows;
}
export async function eligibleTagStaff(pool,identity){
  return transaction(pool,async db=>{await active(db,identity);return {people:(await db.query("SELECT object_id AS id,name FROM workspace_member WHERE tenant_id=$1 AND status='ACTIVE' ORDER BY lower(name),object_id LIMIT 500",[identity.tenantId])).rows};});
}
export async function readStaffTags(pool,identity,{kind,id}){
  return transaction(pool,async db=>{const actor=await active(db,identity),{config,row,canManage}=await resource(db,identity,actor,kind,id);return {tags:await tags(db,identity,config,id),version:row.version,canManage,...(kind==='document'&&staffSharingEnabled()?{sharingMode:row.sharing_mode,departments:row.sharing_departments}: {})};});
}
export async function changeStaffTags(pool,identity,body){
  if(!validTagAction(body))throw new AccessError(400,'Choose up to 10 different colleagues and try again.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity),{config,row,canManage}=await resource(db,identity,actor,body.kind,body.id,true);
    if(!canManage)throw new AccessError(403,'Only the author, uploader or an administrator can change these tags.');
    if(row.version!==body.version)throw new AccessError(409,'This resource changed. Reload its tags before saving.');
    const staffIds=body.staffIds.map(id=>id.toLowerCase());
    await validateRecipients(db,identity,staffIds);
    const count=(await db.query(`INSERT INTO workspace_throttle(key,count,reset_at) VALUES ($1,1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN workspace_throttle.reset_at<=now() THEN 1 ELSE workspace_throttle.count+1 END, reset_at=CASE WHEN workspace_throttle.reset_at<=now() THEN now()+interval '1 minute' ELSE workspace_throttle.reset_at END RETURNING count`,[`${identity.objectId}:staff-tags`])).rows[0].count;
    if(count>20)throw new AccessError(429,'Please wait a minute before changing more tags.');
    await db.query(`DELETE FROM ${config.tags} WHERE tenant_id=$1 AND resource_id=$2`,[identity.tenantId,body.id]);
    for(const staffId of staffIds)await db.query(`INSERT INTO ${config.tags}(tenant_id,resource_id,staff_object_id,tagged_by_object_id) VALUES ($1,$2,$3,$4)`,[identity.tenantId,body.id,staffId,identity.objectId]);
    if(body.kind==='document'&&staffSharingEnabled())await db.query('UPDATE workspace_document SET sharing_mode=$3,sharing_departments=$4 WHERE tenant_id=$1 AND id=$2',[identity.tenantId,body.id,body.sharingMode,body.departments]);
    await db.query(`UPDATE ${config.table} SET updated_at=now(),version=version+1 WHERE tenant_id=$1 AND id=$2`,[identity.tenantId,body.id]);
    await db.query("INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES ($1,$1,'staff-tags-updated',$2)",[identity.objectId,JSON.stringify({kind:body.kind,resourceId:body.id,count:staffIds.length})]);
    return {tags:await tags(db,identity,config,body.id),version:row.version+1,canManage:true,...(body.kind==='document'&&staffSharingEnabled()?{sharingMode:body.sharingMode,departments:body.departments}: {})};
  });
}
