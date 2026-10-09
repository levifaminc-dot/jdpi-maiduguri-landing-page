import 'server-only';
import {verifiedIdentity} from './microsoft-policy.mjs';
import {AccessError,readMember,transaction} from './membership.mjs';

export const announcementCategories=['General','People','Operations','Field updates'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields=(body,keys)=>body && typeof body==='object' && !Array.isArray(body) && Object.keys(body).every(k=>keys.includes(k));
const text=(value,max)=>typeof value==='string' && value.trim().length>0 && value.length<=max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
export function validAnnouncementAction(body) {
  if(!body || !uuid.test(body.id ?? '')) return false;
  if(body.action==='create') return fields(body,['action','id','title','body','category']) && text(body.title,180) && text(body.body,12000) && announcementCategories.includes(body.category);
  if(body.action==='comment') return fields(body,['action','id','announcementId','body']) && uuid.test(body.announcementId ?? '') && text(body.body,2000);
  if(body.action==='hide-comment') return fields(body,['action','id']);
  if(!Number.isSafeInteger(body.version) || body.version<1 || body.version>=2147483647) return false;
  if(body.action==='edit') return fields(body,['action','id','version','title','body','category']) && text(body.title,180) && text(body.body,12000) && announcementCategories.includes(body.category);
  if(['publish','archive','restore'].includes(body.action)) return fields(body,['action','id','version']);
  if(['pin','comments'].includes(body.action)) return fields(body,['action','id','version','enabled']) && typeof body.enabled==='boolean';
  return false;
}
async function active(db,identity) {
  if(!verifiedIdentity(identity)) throw new AccessError(401,'Please sign in with your JDPI account.');
  // Membership writes take FOR UPDATE on this same row. Hold the shared lock
  // through every read/write: suspension cannot race a content operation.
  await db.query('SELECT id FROM workspace_control WHERE id=1 FOR SHARE');
  const actor=await readMember(db,identity);
  if(actor?.status!=='ACTIVE') throw new AccessError(403,'Active staff access is required.');
  return actor;
}
const date=value=>value ? new Date(value).toISOString() : null;
function dto(row,actor,identity) {
  return {id:row.id,title:row.title,body:row.body,category:row.category,status:row.status,
    pinned:row.pinned,commentsEnabled:row.comments_enabled,version:row.version,author:row.author_name,
    createdAt:date(row.created_at),publishedAt:date(row.published_at),updatedAt:date(row.updated_at),commentCount:Number(row.comment_count ?? 0),
    canManage:actor.role==='ADMIN' || (row.author_object_id===identity.objectId && !row.moderated),canPin:actor.role==='ADMIN'};
}
const columns=`a.*, m.name AS author_name,
  (SELECT count(*) FROM workspace_comment c WHERE c.announcement_id=a.id AND c.hidden_at IS NULL) AS comment_count`;
const join=`workspace_announcement a JOIN workspace_member m ON m.tenant_id=a.tenant_id AND m.object_id=a.author_object_id`;
export async function announcementFeed(pool,identity,{status='PUBLISHED',query='',offset=0}={}) {
  if(!['PUBLISHED','DRAFT','ARCHIVED'].includes(status) || typeof query!=='string' || query.length>100 || !Number.isSafeInteger(offset) || offset<0 || offset>10000) throw new AccessError(400,'Invalid announcement filter.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity);
    const rows=(await db.query(`SELECT ${columns} FROM ${join} WHERE a.tenant_id=$1 AND a.status=$2
      AND ($2='PUBLISHED' OR $5 OR a.author_object_id=$6)
      AND (a.title ILIKE $3 OR a.body ILIKE $3) ORDER BY a.pinned DESC, a.published_at DESC NULLS LAST,a.created_at DESC,a.id DESC LIMIT 21 OFFSET $4`,[identity.tenantId,status,`%${query.trim().replace(/[\\%_]/g,'\\$&')}%`,offset,actor.role==='ADMIN',identity.objectId])).rows;
    return {posts:rows.slice(0,20).map(row=>({...dto(row,actor,identity),body:row.body.slice(0,240)})),hasMore:rows.length>20};
  });
}
export async function announcementDetail(pool,identity,id,offset=0) {
  if(!uuid.test(id ?? '') || !Number.isSafeInteger(offset) || offset<0 || offset>10000) throw new AccessError(400,'Invalid announcement.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity);
    const row=(await db.query(`SELECT ${columns} FROM ${join} WHERE a.tenant_id=$1 AND a.id=$2`,[identity.tenantId,id])).rows[0];
    if(!row || (row.status!=='PUBLISHED' && actor.role!=='ADMIN' && row.author_object_id!==identity.objectId)) throw new AccessError(404,'This announcement is not available.');
    const comments=(await db.query(`SELECT c.id,c.body,c.created_at,c.hidden_at,c.author_object_id,m.name AS author_name
      FROM workspace_comment c JOIN workspace_member m ON m.tenant_id=c.tenant_id AND m.object_id=c.author_object_id
      WHERE c.tenant_id=$1 AND c.announcement_id=$2 ORDER BY c.created_at DESC,c.id DESC LIMIT 51 OFFSET $3`,[identity.tenantId,id,offset])).rows;
    return {post:dto(row,actor,identity),comments:comments.slice(0,50).map(c=>({id:c.id,body:c.hidden_at?null:c.body,author:c.author_name,createdAt:date(c.created_at),canRemove:!c.hidden_at && (actor.role==='ADMIN' || c.author_object_id===identity.objectId)})),hasMoreComments:comments.length>50};
  });
}
async function throttle(db,identity) {
  const row=(await db.query(`INSERT INTO workspace_throttle(key,count,reset_at) VALUES ($1,1,now()+interval '1 minute')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN workspace_throttle.reset_at<=now() THEN 1 ELSE workspace_throttle.count+1 END,
    reset_at=CASE WHEN workspace_throttle.reset_at<=now() THEN now()+interval '1 minute' ELSE workspace_throttle.reset_at END RETURNING count`,[`${identity.objectId}:announcements`])).rows[0];
  if(row.count>15) throw new AccessError(429,'Please wait a minute before posting again.');
}
async function audit(db,identity,action,details) {
  // Store IDs/state only, never announcement text or comment bodies in audits.
  await db.query('INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES ($1,$1,$2,$3)',[identity.objectId,`announcement-${action}`,JSON.stringify(details)]);
}
export async function changeAnnouncement(pool,identity,body) {
  if(!validAnnouncementAction(body)) throw new AccessError(400,'Check your announcement details and try again.');
  return transaction(pool,async db=>{
    const actor=await active(db,identity);
    if(['pin','comments'].includes(body.action) && actor.role!=='ADMIN') throw new AccessError(403,'Only administrators can pin announcements or manage discussion settings.');
    await throttle(db,identity);
    if(body.action==='create') {
      const inserted=await db.query(`INSERT INTO workspace_announcement(id,tenant_id,author_object_id,title,body,category)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING RETURNING id`,[body.id,identity.tenantId,identity.objectId,body.title.trim(),body.body.trim(),body.category]);
      if(!inserted.rows.length) throw new AccessError(409,'This draft has already been saved. Refresh the announcements page.');
      await audit(db,identity,'created',{announcementId:body.id});
      return {id:body.id};
    }
    if(body.action==='hide-comment') {
      const comment=(await db.query('SELECT id,announcement_id,author_object_id,hidden_at FROM workspace_comment WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[identity.tenantId,body.id])).rows[0];
      if(!comment) throw new AccessError(404,'Comment not found.');
      if(actor.role!=='ADMIN' && comment.author_object_id!==identity.objectId) throw new AccessError(403,'You can remove only your own comments.');
      if(!comment.hidden_at) {
        await db.query('UPDATE workspace_comment SET hidden_at=now(),hidden_by_object_id=$2 WHERE id=$1',[body.id,identity.objectId]);
        await audit(db,identity,'comment-removed',{announcementId:comment.announcement_id,commentId:body.id});
      }
      return {id:comment.announcement_id};
    }
    const id=body.action==='comment'?body.announcementId:body.id;
    const post=(await db.query('SELECT * FROM workspace_announcement WHERE tenant_id=$1 AND id=$2 FOR UPDATE',[identity.tenantId,id])).rows[0];
    if(!post) throw new AccessError(404,'Announcement not found.');
    if(body.action!=='comment' && actor.role!=='ADMIN' && post.author_object_id!==identity.objectId) throw new AccessError(403,'You can manage only your own announcements.');
    if(body.action!=='comment' && actor.role!=='ADMIN' && post.moderated) throw new AccessError(403,'An administrator archived this update. Contact an admin to request a review.');
    if(body.action==='comment') {
      if(post.status!=='PUBLISHED' || !post.comments_enabled) throw new AccessError(409,'Comments are closed for this announcement.');
      const inserted=await db.query(`INSERT INTO workspace_comment(id,tenant_id,announcement_id,author_object_id,body)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING RETURNING id`,[body.id,identity.tenantId,id,identity.objectId,body.body.trim()]);
      if(!inserted.rows.length) throw new AccessError(409,'This comment has already been saved. Refresh the discussion.');
      await audit(db,identity,'commented',{announcementId:id,commentId:body.id});
      return {id};
    }
    if(post.version!==body.version) throw new AccessError(409,'This announcement changed. Refresh the page before saving again.');
    if(body.action==='edit') {
      if(post.status==='ARCHIVED') throw new AccessError(409,'Restore this announcement to drafts before editing.');
      await db.query('UPDATE workspace_announcement SET title=$2,body=$3,category=$4,updated_at=now(),version=version+1 WHERE id=$1',[id,body.title.trim(),body.body.trim(),body.category]);
    } else {
      if(body.action==='publish' && post.status!=='DRAFT') throw new AccessError(409,'Only drafts can be published.');
      if(body.action==='archive' && post.status==='ARCHIVED') throw new AccessError(409,'Already archived.');
      if(body.action==='restore' && post.status!=='ARCHIVED') throw new AccessError(409,'Only archived updates can be restored.');
      if(body.action==='pin' && post.status!=='PUBLISHED') throw new AccessError(409,'Only published updates can be pinned.');
      if(body.action==='publish') await db.query("UPDATE workspace_announcement SET status='PUBLISHED',published_at=now(),updated_at=now(),version=version+1 WHERE id=$1",[id]);
      if(body.action==='archive') await db.query("UPDATE workspace_announcement SET status='ARCHIVED',pinned=false,moderated=$2,updated_at=now(),version=version+1 WHERE id=$1",[id,actor.role==='ADMIN' && post.author_object_id!==identity.objectId]);
      if(body.action==='restore') await db.query("UPDATE workspace_announcement SET status='DRAFT',pinned=false,moderated=false,updated_at=now(),version=version+1 WHERE id=$1",[id]);
      if(body.action==='pin') await db.query('UPDATE workspace_announcement SET pinned=$2,updated_at=now(),version=version+1 WHERE id=$1',[id,body.enabled]);
      if(body.action==='comments') await db.query('UPDATE workspace_announcement SET comments_enabled=$2,updated_at=now(),version=version+1 WHERE id=$1',[id,body.enabled]);
    }
    await audit(db,identity,body.action,{announcementId:id,previousStatus:post.status});
    return {id};
  });
}
