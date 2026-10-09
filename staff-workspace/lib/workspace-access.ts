import 'server-only';
import {getAuth} from './auth';
import {getPool} from './database.mjs';
import {AccessError, identityOf, readMember} from './membership.mjs';
export async function workspaceIdentity(requestHeaders:Headers) {
  const auth=getAuth();
  if(!auth) throw new AccessError(503,'Microsoft sign-in is not configured.');
  const session=await auth.api.getSession({headers:requestHeaders, query:{disableCookieCache:!!getPool()}});
  if(!session) throw new AccessError(401,'Please sign in.');
  return identityOf(session.user);
}
export async function requireActiveMember(requestHeaders:Headers) {
  const pool=getPool();
  if(!pool) throw new AccessError(503,'Membership database is not connected.');
  const identity=await workspaceIdentity(requestHeaders);
  const member=await readMember(pool,identity);
  if(member?.status!=='ACTIVE') throw new AccessError(403,'Staff admission is required.');
  return {identity,member,pool};
}
