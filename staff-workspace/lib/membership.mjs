import {JDPI_TENANT_ID, verifiedIdentity} from './microsoft-policy.mjs';

export class AccessError extends Error {
  constructor(status, message) {super(message); this.status=status;}
}
export function identityOf(user) {
  if (!verifiedIdentity(user)) throw new AccessError(401,'Please sign in with your JDPI account.');
  return {tenantId:JDPI_TENANT_ID, objectId:user.objectId.toLowerCase(), name:(user.name || 'JDPI colleague').slice(0,150)};
}
export function validMemberChange(body) {
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!body || typeof body!=='object' || Array.isArray(body) || !uuid.test(body.objectId ?? '')) return false;
  if (body.action === 'invite') return Object.keys(body).every(k=>['action','objectId','name'].includes(k)) && typeof body.name==='string' && body.name.trim().length>0 && body.name.trim().length<=150;
  if (body.action === 'role') return Object.keys(body).every(k=>['action','objectId','role'].includes(k)) && ['STAFF','ADMIN'].includes(body.role);
  return ['admit','suspend','restore'].includes(body.action) && Object.keys(body).every(k=>['action','objectId'].includes(k));
}
export function memberDto(row) {
  return row ? {objectId:row.object_id, name:row.name, role:row.role, status:row.status} : null;
}
export async function transaction(pool, work) {
  const client=await pool.connect();
  try {await client.query('BEGIN'); const value=await work(client); await client.query('COMMIT'); return value;}
  catch(error) {await client.query('ROLLBACK'); throw error;}
  finally {client.release();}
}
export async function readMember(db, identity) {
  return (await db.query('SELECT object_id, name, role, status FROM workspace_member WHERE tenant_id=$1 AND object_id=$2',[identity.tenantId,identity.objectId])).rows[0] ?? null;
}
async function audit(db, actor, target, action, details={}) {
  await db.query('INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES ($1,$2,$3,$4)',[actor.objectId,target,action,JSON.stringify(details)]);
}
async function limit(db, identity, action) {
  // Shared DB-backed limit, not an in-memory counter per Vercel instance.
  const result=await db.query(`INSERT INTO workspace_throttle(key,count,reset_at) VALUES ($1,1,now()+interval '1 minute')
    ON CONFLICT (key) DO UPDATE SET count=CASE WHEN workspace_throttle.reset_at<=now() THEN 1 ELSE workspace_throttle.count+1 END,
    reset_at=CASE WHEN workspace_throttle.reset_at<=now() THEN now()+interval '1 minute' ELSE workspace_throttle.reset_at END RETURNING count`,[`${identity.objectId}:${action}`]);
  if(result.rows[0].count>20) throw new AccessError(429,'Too many requests. Please wait a minute.');
}
export async function requestAccess(pool, identity) {
  return transaction(pool,async db=>{
    await limit(db,identity,'request');
    const inserted=await db.query(`INSERT INTO workspace_member(tenant_id,object_id,name,status) VALUES ($1,$2,$3,'PENDING') ON CONFLICT DO NOTHING RETURNING object_id`,[identity.tenantId,identity.objectId,identity.name]);
    if(inserted.rows.length) await audit(db,identity,identity.objectId,'access-requested');
    // A suspended identity cannot turn itself back into a pending/active member.
    return memberDto(await readMember(db,identity));
  });
}
export async function acceptInvitation(pool, identity) {
  return transaction(pool,async db=>{
    await db.query('SELECT id FROM workspace_control WHERE id=1 FOR UPDATE');
    await limit(db,identity,'request');
    const result=await db.query(`UPDATE workspace_member SET status='ACTIVE',name=$3,updated_at=now() WHERE tenant_id=$1 AND object_id=$2 AND status='INVITED' AND role='STAFF' RETURNING object_id`,[identity.tenantId,identity.objectId,identity.name]);
    if(!result.rows.length) throw new AccessError(409,'No matching invitation is available.');
    await audit(db,identity,identity.objectId,'invitation-accepted');
    return memberDto(await readMember(db,identity));
  });
}
export async function adminOverview(pool, identity) {
  return transaction(pool,async db=>{
    // Shared lock gives one consistent authorisation/data snapshot.
    await db.query('SELECT id FROM workspace_control WHERE id=1 FOR SHARE');
    const actor=await readMember(db,identity);
    if(actor?.status!=='ACTIVE' || actor.role!=='ADMIN') throw new AccessError(403,'Only active admins can manage membership.');
    const members=(await db.query('SELECT object_id,name,role,status FROM workspace_member ORDER BY created_at DESC LIMIT 1000')).rows.map(memberDto);
    const events=(await db.query('SELECT action,details,created_at FROM workspace_audit ORDER BY id DESC LIMIT 30')).rows;
    return {members,events};
  });
}
export async function changeMember(pool, identity, body) {
  if(!validMemberChange(body)) throw new AccessError(400,'Invalid membership change.');
  return transaction(pool,async db=>{
    // Serialize role/admission changes, including checks for the last admin.
    // Recheck actor INSIDE the transaction, never trust a client role/session role.
    await db.query('SELECT id FROM workspace_control WHERE id=1 FOR UPDATE');
    const actor=await readMember(db,identity);
    if(actor?.status!=='ACTIVE' || actor.role!=='ADMIN') throw new AccessError(403,'Only active admins can manage membership.');
    await limit(db,identity,'admin');
    const targetId=body.objectId.toLowerCase();
    const targetIdentity={tenantId:identity.tenantId,objectId:targetId};
    const target=await readMember(db,targetIdentity);
    if(body.action==='invite') {
      if(target) throw new AccessError(409,'This identity already has a membership record.');
      await db.query(`INSERT INTO workspace_member(tenant_id,object_id,name,status) VALUES ($1,$2,$3,'INVITED')`,[identity.tenantId,targetId,body.name.trim()]);
    } else {
      if(!target) throw new AccessError(404,'Membership not found.');
      if(target.status==='ACTIVE' && target.role==='ADMIN' && (body.action==='suspend' || (body.action==='role' && body.role==='STAFF'))) {
        const count=(await db.query(`SELECT count(*)::int AS count FROM workspace_member WHERE status='ACTIVE' AND role='ADMIN'`)).rows[0].count;
        if(count<=1) throw new AccessError(409,'Keep at least one active administrator.');
      }
      let status=target.status, role=target.role;
      if(body.action==='admit') {if(status!=='PENDING') throw new AccessError(409,'Only pending requests can be admitted.'); status='ACTIVE'; role='STAFF';}
      if(body.action==='restore') {if(status!=='SUSPENDED') throw new AccessError(409,'Only suspended staff can be restored.'); status='ACTIVE'; role='STAFF';}
      if(body.action==='suspend') {if(status==='SUSPENDED') throw new AccessError(409,'Already suspended.'); status='SUSPENDED';}
      if(body.action==='role') {if(status!=='ACTIVE') throw new AccessError(409,'Assign roles only to active staff.'); role=body.role;}
      await db.query('UPDATE workspace_member SET status=$3,role=$4,updated_at=now() WHERE tenant_id=$1 AND object_id=$2',[identity.tenantId,targetId,status,role]);
      if(body.action==='suspend' || body.action==='role') {
        // Invalidate all durable sessions for the affected immutable identity.
        await db.query(`DELETE FROM "session" WHERE "userId" IN (SELECT id FROM "user" WHERE "tenantId"=$1 AND "objectId"=$2)`,[identity.tenantId,targetId]);
      }
    }
    await audit(db,identity,targetId,body.action,{previous:target ? {role:target.role,status:target.status} : null, next:memberDto(await readMember(db,targetIdentity))});
    return memberDto(await readMember(db,targetIdentity));
  });
}
// Operator-only initialisation; never imported by a public route. Caller must
// explicitly approve the exact immutable identity before running the CLI.
export async function bootstrapAdmin(pool, identity) {
  if(!verifiedIdentity(identity)) throw new AccessError(400,'Invalid JDPI identity.');
  return transaction(pool,async db=>{
    await db.query('SELECT id FROM workspace_control WHERE id=1 FOR UPDATE');
    const existing=(await db.query(`SELECT count(*)::int AS count FROM workspace_member WHERE role='ADMIN'`)).rows[0].count;
    if(existing) throw new AccessError(409,'An admin already exists; use normal admin role management.');
    const user=(await db.query(`SELECT id FROM "user" WHERE "tenantId"=$1 AND "objectId"=$2`,[identity.tenantId,identity.objectId])).rows[0];
    const member=await readMember(db,identity);
    if(!user || member?.status!=='PENDING') throw new AccessError(409,'Sign in and request access before the first-admin bootstrap.');
    await db.query(`UPDATE workspace_member SET status='ACTIVE',role='ADMIN',updated_at=now() WHERE tenant_id=$1 AND object_id=$2`,[identity.tenantId,identity.objectId]);
    await db.query('DELETE FROM "session" WHERE "userId"=$1',[user.id]);
    // Do not falsely attribute the operator CLI grant to the recipient user.
    await db.query(`INSERT INTO workspace_audit(actor_object_id,target_object_id,action,details) VALUES (NULL,$1,'operator-first-admin-bootstrap',$2)`,[identity.objectId,JSON.stringify({source:'operator-cli',confirmation:'explicit-object-id'})]);
  });
}
