import 'server-only';
import {AccessError} from './membership.mjs';
import {documentId} from './document-policy.mjs';
import {departmentGroups} from './directory-departments.mjs';
export const audienceDepartments=departmentGroups.map(group=>group.name);
export const staffSharingEnabled=()=>process.env.STAFF_TAGGING_ENABLED==='true';
export function validDocumentAudience(value){
  return value&&['SELECTED','ALL_STAFF'].includes(value.sharingMode)&&Array.isArray(value.departments)&&value.departments.length<=17&&value.departments.every(d=>audienceDepartments.includes(d))&&new Set(value.departments).size===value.departments.length&&Array.isArray(value.staffIds)&&value.staffIds.length<=10&&value.staffIds.every(documentId)&&new Set(value.staffIds.map(id=>id.toLowerCase())).size===value.staffIds.length&&(value.sharingMode!=='ALL_STAFF'||value.departments.length===0&&value.staffIds.length===0);
}
export function uploadAudience(metadata){
  const audience={sharingMode:metadata.sharingMode??'SELECTED',departments:metadata.departments??[],staffIds:metadata.staffIds??[]};
  if(!validDocumentAudience(audience))throw new AccessError(400,'Choose an approved PDF audience.');
  return {...audience,staffIds:audience.staffIds.map(id=>id.toLowerCase())};
}
// Call only after fresh active membership has been verified under the control lock.
export async function validateRecipients(db,identity,staffIds){
  if(!staffIds.length)return;
  const count=(await db.query("SELECT count(*)::int AS n FROM workspace_member WHERE tenant_id=$1 AND status='ACTIVE' AND object_id=ANY($2::uuid[])",[identity.tenantId,staffIds])).rows[0].n;
  if(count!==staffIds.length)throw new AccessError(400,'A selected colleague is no longer approved. Reload the colleague list.');
}
export function documentAudienceSql(alias='d'){
  if(alias!=='d')throw new Error('Invalid document alias.');
  // Parameter convention matches documentFeed: tenant=$1, object=$3, admin=$4.
  return `( $4 OR d.uploader_object_id=$3 OR d.sharing_mode='ALL_STAFF'
    OR EXISTS(SELECT 1 FROM workspace_document_tag t WHERE t.tenant_id=d.tenant_id AND t.resource_id=d.id AND t.staff_object_id=$3)
    OR EXISTS(SELECT 1 FROM workspace_staff_profile p WHERE p.tenant_id=d.tenant_id AND p.object_id=$3 AND p.department<>'' AND p.department=ANY(d.sharing_departments)) )`;
}
export async function canReadDocument(db,identity,actor,row){
  if(!row||!['READY','ARCHIVED'].includes(row.status))return false;
  if(actor.role==='ADMIN'||row.uploader_object_id===identity.objectId)return true;
  if(row.status!=='READY')return false;
  if(!staffSharingEnabled())return true; // compatibility until migration + activation
  if(row.sharing_mode==='ALL_STAFF')return true;
  return (await db.query(`SELECT EXISTS(SELECT 1 FROM workspace_document_tag WHERE tenant_id=$1 AND resource_id=$2 AND staff_object_id=$3)
    OR EXISTS(SELECT 1 FROM workspace_staff_profile WHERE tenant_id=$1 AND object_id=$3 AND department<>'' AND department=ANY($4::text[])) AS allowed`,[identity.tenantId,row.id,identity.objectId,row.sharing_departments||[]])).rows[0].allowed;
}
