import {redirect} from 'next/navigation';
import {headers} from 'next/headers';
import {MicrosoftSignOut} from '../../components/MicrosoftSignIn';
import {AccessRequest, MembershipAdmin} from '../../components/Membership';
import {workspaceIdentity} from '../../lib/workspace-access';
import {getPool} from '../../lib/database.mjs';
import {AccessError, readMember, adminOverview} from '../../lib/membership.mjs';
export const dynamic = 'force-dynamic';
export default async function WorkspacePage() {
  let identity;
  try {identity=await workspaceIdentity(await headers());} catch(error) {if(error instanceof AccessError && error.status===401) redirect('/'); redirect('/auth/error');}
  let member=null, overview=null, connected=false;
  try {
    const pool=getPool();
    if(pool) {member=await readMember(pool,identity);connected=true;if(member?.status==='ACTIVE' && member.role==='ADMIN') overview=await adminOverview(pool,identity);}
  } catch {connected=false;member=null;overview=null;}
  if(!connected || member?.status!=='ACTIVE') return <main className="identity-page"><section className="identity-card"><p className="eyebrow">JDPI STAFF WORKSPACE</p><span className="identity-check" aria-hidden="true">✓</span><h1>Welcome, {identity.name}.</h1><p>Your JDPI Microsoft identity has been verified.</p><div className="admission-note"><strong>{connected?'Workspace admission':'Membership setup in progress'}</strong>{connected ? <AccessRequest status={member?.status ?? null}/> : <p>The membership database is not connected yet. Your account has not been admitted or assigned a role. Private staff content remains locked.</p>}</div><p className="muted">Signing out here does not sign you out of other Microsoft applications.</p><MicrosoftSignOut/></section></main>;
  return <main className="member-workspace"><header className="member-workspace-header"><a href="/workspace" aria-label="JDPI workspace home">JDPI <span>STAFF WORKSPACE</span></a><div><span>{identity.name} · {member.role==='ADMIN'?'Admin':'Staff'}</span><MicrosoftSignOut/></div></header><section className="member-welcome"><p className="eyebrow">ONE TEAM. A SHARED PURPOSE.</p><h1>Welcome to your workspace.</h1><p>Your staff access is active. This first release connects membership; announcements, documents and the directory will be connected next.</p></section>{overview && <MembershipAdmin members={overview.members} events={overview.events}/>}<div className="member-coming"><article><h2>Announcements</h2><p>Team updates and conversations. Publishing is being connected.</p></article><article><h2>Documents</h2><p>Private files with PDF previews. Secure storage is being connected.</p></article><article><h2>Staff directory</h2><p>A directory of admitted colleagues. Staff profiles are being connected.</p></article></div></main>;
}
