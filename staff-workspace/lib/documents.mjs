import 'server-only';
import {createHash} from 'node:crypto';
import {verifiedIdentity} from './microsoft-policy.mjs';
import {AccessError,readMember,transaction} from './membership.mjs';
import {validatePdf} from './pdf-validation.mjs';
import {documentFolders,documentId,documentPath,validDocumentUpload,validDocumentAction,PDF_MAX_BYTES,DOCUMENT_BUDGET_BYTES} from './document-policy.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function active(db,identity) {
  if(!verifiedIdentity(identity))throw new AccessError(401,'Please sign in with your JDPI account.');
  await db.query('SELECT id FROM workspace_control WHERE id=1 FOR SHARE');
  const actor=await readMember(db,identity);if(actor?.status!=='ACTIVE')throw new AccessError(403,'Active staff access is required.');return actor;
}
const manageable=(row,actor,identity)=>actor.role==='ADMIN' || (row.uploader_object_id===identity.objectId && !row.moderated);
function dto(row,actor,identity) {
  return {id:row.id,title:row.title,description:row.description,folder:row.folder,filename:row.filename,bytes:row.byte_size,pages:row.page_count,status:row.status,version:row.version,uploader:row.uploader_name,createdAt:new Date(row.created_at).toISOString(),canManage:manageable(row,actor,identity)};
}
const join='workspace_document d JOIN workspace_member m ON m.tenant_id=d.tenant_id AND m.object_id=d.uploader_object_id';
async function audit(db,identity,action,id) {await db.query('INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES ($1,$1,$2,$3)',[identity.objectId,`document-${action}`,JSON.stringify({documentId:id})]);}
export async function documentFeed(pool,identity,{view='library',folder='',query='',offset=0}={}) {
  if(!['library','mine','archive'].includes(view) || (folder && !documentFolders.includes(folder)) || typeof query!=='string' || query.length>100 || !Number.isSafeInteger(offset) || offset<0 || offset>10000)throw new AccessError(400,'Invalid document filter.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity);
    const rows=(await db.query(`SELECT d.*,m.name AS uploader_name FROM ${join} WHERE d.tenant_id=$1
      AND (($2='library' AND d.status='READY') OR ($2='mine' AND d.uploader_object_id=$3) OR ($2='archive' AND d.status='ARCHIVED' AND ($4 OR d.uploader_object_id=$3)))
      AND ($5='' OR d.folder=$5) AND (d.title ILIKE $6 OR d.description ILIKE $6)
      ORDER BY d.created_at DESC,d.id DESC LIMIT 21 OFFSET $7`,[identity.tenantId,view,identity.objectId,actor.role==='ADMIN',folder,`%${query.trim().replace(/[\\%_]/g,'\\$&')}%`,offset])).rows;
    return {documents:rows.slice(0,20).map(row=>dto(row,actor,identity)),hasMore:rows.length>20};
  });
}
async function throttle(db,identity) {
  for(const [period,maximum]of [['1 minute',3],['1 day',10]]) {
    const row=(await db.query(`INSERT INTO workspace_throttle(key,count,reset_at) VALUES ($1,1,now()+$2::interval)
      ON CONFLICT(key) DO UPDATE SET count=CASE WHEN workspace_throttle.reset_at<=now() THEN 1 ELSE workspace_throttle.count+1 END,
      reset_at=CASE WHEN workspace_throttle.reset_at<=now() THEN now()+$2::interval ELSE workspace_throttle.reset_at END RETURNING count`,[`${identity.objectId}:pdf-upload:${period}`,period])).rows[0];
    if(row.count>maximum)throw new AccessError(429,'Upload limit reached. Each colleague can share 3 PDFs per minute and 10 per day. Please try later.');
  }
}
export async function uploadDocument(pool,identity,metadata,bytes,storage,validator=validatePdf) {
  if(!validDocumentUpload(metadata) || !(bytes instanceof Uint8Array) || bytes.length>PDF_MAX_BYTES)throw new AccessError(400,'Check the title, folder and PDF file. The maximum size is 3 MB.');
  // Authorize before spending CPU on untrusted parsing, then recheck after it.
  if(!storage)throw new AccessError(503,'Private document storage is not connected yet. Nothing has been uploaded.');
  await transaction(pool,async db=>{await active(db,identity);await throttle(db,identity);});
  const pages=await validator(bytes);const sha256=hash(bytes),pathname=documentPath(identity.tenantId,metadata.id);
  const ready=await transaction(pool,async db=>{
    const actor=await active(db,identity);
    await db.query('SELECT id FROM workspace_document_control WHERE id=1 FOR UPDATE');
    const existing=(await db.query(`SELECT d.*,m.name AS uploader_name FROM ${join} WHERE d.id=$1`,[metadata.id])).rows[0];
    if(existing) {
      if(existing.uploader_object_id!==identity.objectId || existing.sha256!==sha256 || existing.title!==metadata.title.trim() || existing.description!==metadata.description.trim() || existing.folder!==metadata.folder || existing.filename!==metadata.filename)throw new AccessError(409,'This upload ID has already been used. Choose the file again.');
      if(existing.status==='READY')return dto(existing,actor,identity);
      throw new AccessError(409,'This upload did not complete or is still running. Check My uploads before choosing the file again.');
    }
    const budget=(await db.query('SELECT reserved_bytes FROM workspace_document_control WHERE id=1')).rows[0];
    if(Number(budget.reserved_bytes)+bytes.length>DOCUMENT_BUDGET_BYTES)throw new AccessError(409,'The workspace file allowance is full. Contact an administrator; no paid upgrade is started automatically.');
    await db.query('UPDATE workspace_document_control SET reserved_bytes=reserved_bytes+$1 WHERE id=1',[bytes.length]);
    await db.query(`INSERT INTO workspace_document(id,tenant_id,uploader_object_id,title,description,folder,filename,byte_size,page_count,sha256,blob_path)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[metadata.id,identity.tenantId,identity.objectId,metadata.title.trim(),metadata.description.trim(),metadata.folder,metadata.filename,bytes.length,pages,sha256,pathname]);
    return null;
  });
  if(ready)return ready;
  try {
    await storage.put(pathname,bytes);
    return await transaction(pool,async db=>{
      const actor=await active(db,identity);
      const row=(await db.query(`UPDATE workspace_document SET status='READY',updated_at=now(),version=version+1
        WHERE id=$1 AND tenant_id=$2 AND uploader_object_id=$3 AND status='UPLOADING' RETURNING *`,[metadata.id,identity.tenantId,identity.objectId])).rows[0];
      if(!row)throw new AccessError(409,'This upload is no longer available.');
      await audit(db,identity,'shared',row.id);return dto({...row,uploader_name:actor.name},actor,identity);
    });
  } catch(error) {
    // Only finalize this actor's reservation. Never delete a Blob: a failed
    // COMMIT acknowledgement could have published it successfully already.
    try{await transaction(pool,db=>db.query("UPDATE workspace_document SET status='FAILED',updated_at=now(),version=version+1 WHERE id=$1 AND tenant_id=$2 AND uploader_object_id=$3 AND status='UPLOADING'",[metadata.id,identity.tenantId,identity.objectId]));}catch{}
    if(error instanceof AccessError)throw error;
    throw new AccessError(503,'The upload could not be completed. Check My uploads before trying again.');
  }
}
export async function changeDocument(pool,identity,body) {
  if(!validDocumentAction(body))throw new AccessError(400,'Invalid document action.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity);
    const row=(await db.query('SELECT * FROM workspace_document WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[identity.tenantId,body.id])).rows[0];
    if(!row)throw new AccessError(404,'Document not found.');
    if(!manageable(row,actor,identity))throw new AccessError(403,'Only the uploader or an administrator can manage this document. Admin-moderated archives require admin review.');
    if(row.version!==body.version)throw new AccessError(409,'This document changed. Refresh the page before trying again.');
    if((body.action==='archive' && row.status!=='READY') || (body.action==='restore' && row.status!=='ARCHIVED'))throw new AccessError(409,'This action is not available for the document.');
    await db.query('UPDATE workspace_document SET status=$2,moderated=$3,version=version+1,updated_at=now() WHERE id=$1',[row.id,body.action==='archive'?'ARCHIVED':'READY',body.action==='archive' && actor.role==='ADMIN' && row.uploader_object_id!==identity.objectId]);
    await audit(db,identity,body.action,row.id);return {id:row.id};
  });
}
export async function readDocumentFile(pool,identity,id,storage) {
  if(!documentId(id))throw new AccessError(404,'Document not found.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity);
    const row=(await db.query('SELECT * FROM workspace_document WHERE tenant_id=$1 AND id=$2',[identity.tenantId,id])).rows[0];
    if(!row || !['READY','ARCHIVED'].includes(row.status) || (row.status==='ARCHIVED' && actor.role!=='ADMIN' && row.uploader_object_id!==identity.objectId))throw new AccessError(404,'Document not available.');
    if(!storage || row.blob_path!==documentPath(identity.tenantId,row.id))throw new AccessError(503,'The private file is temporarily unavailable.');
    const bytes=await storage.read(row.blob_path);
    if(!(bytes instanceof Uint8Array) || bytes.length!==row.byte_size || hash(bytes)!==row.sha256)throw new AccessError(503,'The private file could not be verified.');
    return {bytes,filename:row.filename};
  });
}
