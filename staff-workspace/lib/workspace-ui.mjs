// Presentation helpers only. Membership authority remains tenant + Microsoft OID.
export const statusLabels = {ACTIVE:'Active', PENDING:'Awaiting approval', INVITED:'Invited', SUSPENDED:'Suspended'};
export function memberCounts(members) {
  return {active:members.filter(m=>m.status==='ACTIVE').length, pending:members.filter(m=>m.status==='PENDING').length,
    suspended:members.filter(m=>m.status==='SUSPENDED').length, admins:members.filter(m=>m.status==='ACTIVE' && m.role==='ADMIN').length};
}
export function filterMembers(members, status, query) {
  const needle=query.trim().toLocaleLowerCase('en');
  return members.filter(m=>(status==='ALL' || m.status===status) && m.name.toLocaleLowerCase('en').includes(needle));
}
export function workspaceNavigation(role) {
  const items=[{href:'/workspace',label:'Dashboard',icon:'dashboard'}];
  if(role==='ADMIN') items.push({href:'/workspace/members',label:'Members',icon:'users'},
    {href:'/workspace/invitations',label:'Invitations',icon:'mail'}, {href:'/workspace/settings',label:'Settings',icon:'settings'});
  return items;
}
export function invitationOrigin(value) {
  try {
    const url=new URL(value);
    const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    if(url.username || url.password || url.search || url.hash || url.pathname!=='/' || (url.protocol!=='https:' && !(local && url.protocol==='http:'))) return null;
    return {url:url.origin,local};
  } catch {return null;}
}
export function invitationDraft(email, name, origin) {
  const recipient=email.trim();
  if(recipient.length>254 || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(recipient)) throw new Error('Enter one valid work email address.');
  const target=invitationOrigin(origin);
  if(!target) throw new Error('The workspace address is not configured.');
  const greeting=name.trim().replace(/[\r\n]/g,' ').slice(0,150) || 'colleague';
  const subject='Join the JDPI staff workspace';
  const body=`Hello ${greeting},\n\nPlease join the JDPI staff workspace at ${target.url}/.\n\n1. Sign in with your JDPI Microsoft work account.\n2. Select “Request workspace access”.\n3. An administrator will review your request before admitting you as staff.\n\nThis link does not grant access or an admin role. If you already have active access, sign in to reach your dashboard.\n\nJDPI Staff Workspace`;
  return {subject,body,mailto:`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,local:target.local};
}
export function accessEventLabel(action) {
  return ({'access-requested':'Workspace access requested', 'operator-first-admin-bootstrap':'First administrator set up',
    admit:'Staff access approved', suspend:'Workspace access suspended', restore:'Staff access restored', role:'Member role changed',
    invite:'Identity invitation created', 'invitation-accepted':'Staff invitation accepted'})[action] || 'Access record updated';
}
