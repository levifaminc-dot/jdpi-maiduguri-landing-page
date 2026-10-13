import {redirect} from 'next/navigation';
import {headers} from 'next/headers';
import Link from 'next/link';
import {MicrosoftSignOut} from '../../components/MicrosoftSignIn';
import {AccessRequest} from '../../components/Membership';
import MemberShell, {PageHeading} from '../../components/MemberShell';
import Icon from '../../components/Icon';
import type {Announcement} from '../../components/Announcements';
import {memberCounts, accessEventLabel} from '../../lib/workspace-ui.mjs';
import {workspaceIdentity} from '../../lib/workspace-access';
import {getPool} from '../../lib/database.mjs';
import {AccessError, readMember, adminOverview} from '../../lib/membership.mjs';
import {announcementFeed} from '../../lib/announcements.mjs';
import {plannerEnabled} from '../../lib/planner-policy.mjs';

export const dynamic = 'force-dynamic';

export default async function WorkspacePage() {
  let identity;
  try {identity=await workspaceIdentity(await headers());} catch(error) {if(error instanceof AccessError && error.status===401) redirect('/'); redirect('/auth/error');}

  let member=null, overview=null, connected=false;
  try {
    const pool=getPool();
    if(pool) {
      member=await readMember(pool,identity);
      connected=true;
      if(member?.status==='ACTIVE' && member.role==='ADMIN') overview=await adminOverview(pool,identity);
    }
  } catch {connected=false;member=null;overview=null;}

  if(!connected || member?.status!=='ACTIVE') return <main className="identity-page"><section className="identity-card"><p className="eyebrow">JDPI STAFF WORKSPACE</p><span className="identity-check" aria-hidden="true">✓</span><h1>Welcome, {identity.name}.</h1><p>Your JDPI Microsoft identity has been verified.</p><div className="admission-note"><strong>{connected?'Workspace admission':'Membership setup in progress'}</strong>{connected ? <AccessRequest status={member?.status ?? null}/> : <p>The membership database is not connected yet. Your account has not been admitted or assigned a role. Private staff content remains locked.</p>}</div><p className="muted">Signing out here does not sign you out of other Microsoft applications.</p><MicrosoftSignOut/></section></main>;

  const counts=overview?memberCounts(overview.members):null;
  let latest:Announcement[]|null=null;
  try {latest=(await announcementFeed(getPool(),identity)).posts.slice(0,3);} catch {/* No fictional fallback. */}
  const recentEvents:{action:string;created_at:string|Date}[]=overview?.events.slice(0,4) ?? [];
  const taskPilot=plannerEnabled(process.env);
  const quickActions=[
    {href:'/workspace/announcements',icon:'megaphone',title:'Announcements',description:'Read updates or share one with the team.'},
    {href:'/workspace/documents',icon:'folder',title:'Documents',description:'Find or share a PDF with the right audience.'},
    {href:'/workspace/directory',icon:'users',title:'Staff directory',description:'Find a colleague and their team.'},
    ...(taskPilot?[{href:'/workspace/tasks',icon:'tasks',title:'Operations tasks',description:'See work in the pilot Planner board.'}]:[]),
  ];

  return <MemberShell name={identity.name} role={member.role} page="Dashboard">
    <PageHeading eyebrow="YOUR WORKSPACE" title={`Welcome, ${identity.name.split(' ')[0]}.`} description="Catch up with colleagues and get to what matters today." action={overview?<Link className="ws-button" href="/workspace/invitations" prefetch={false}><Icon name="mail"/>Invite a colleague</Link>:undefined}/>

    {counts && counts.pending>0 && <div className="ws-attention"><span className="ws-icon-tile ws-icon-amber"><Icon name="clock"/></span><p><strong>{counts.pending} access request{counts.pending===1?'':'s'} to review</strong><span>Check each colleague before approving access.</span></p><Link href="/workspace/members?status=PENDING" prefetch={false}>Review requests<Icon name="arrow"/></Link></div>}

    <section className="ws-start" aria-labelledby="start-heading"><div className="ws-section-heading"><h2 id="start-heading">Start here</h2></div><div className="ws-action-grid">{quickActions.map(action=><Link className="ws-action" href={action.href} prefetch={false} key={action.href}><span className="ws-icon-tile"><Icon name={action.icon}/></span><span className="ws-action-copy"><strong>{action.title}</strong><small>{action.description}</small></span><Icon name="arrow"/></Link>)}</div></section>

    <section className="ws-latest-updates" aria-labelledby="updates-heading"><div className="ws-section-heading"><h2 id="updates-heading">From the noticeboard</h2><Link href="/workspace/announcements" prefetch={false}>All updates<Icon name="arrow"/></Link></div>{latest===null?<p className="ws-notice">Updates are temporarily unavailable.</p>:latest.length?<div className="ws-announcement-feed">{latest.map(post=><article className="ws-card" key={post.id}><div className="ws-post-labels"><span className="ws-badge ws-badge-neutral">{post.category}</span>{post.pinned && <span className="ws-badge">Pinned</span>}</div><h3><Link href={`/workspace/announcements/${post.id}`} prefetch={false}>{post.title}</Link></h3><p className="ws-muted">{post.body.slice(0,160)}{post.body.length>160?'…':''}</p><Link className="ws-post-read" href={`/workspace/announcements/${post.id}`} prefetch={false}>Read & join the discussion<Icon name="arrow"/></Link></article>)}</div>:<div className="ws-card"><p className="ws-muted">No published updates yet. Share the first one with your colleagues.</p><Link className="ws-button ws-button-quiet" href="/workspace/announcements" prefetch={false}>Open announcements<Icon name="megaphone"/></Link></div>}</section>

    {counts && <section className="ws-team-overview" aria-labelledby="team-heading"><div className="ws-section-heading"><h2 id="team-heading">Team overview</h2><Link href="/workspace/members" prefetch={false}>Manage members<Icon name="arrow"/></Link></div><div className="ws-stats"><Link href="/workspace/members?status=ACTIVE" prefetch={false} className="ws-stat"><span className="ws-icon-tile"><Icon name="users"/></span><div><strong>{counts.active}</strong><span>Active members</span></div><Icon name="arrow"/></Link><Link href="/workspace/members?status=PENDING" prefetch={false} className="ws-stat"><span className="ws-icon-tile ws-icon-amber"><Icon name="clock"/></span><div><strong>{counts.pending}</strong><span>Awaiting approval</span></div><Icon name="arrow"/></Link>{counts.suspended>0 && <Link href="/workspace/members?status=SUSPENDED" prefetch={false} className="ws-stat"><span className="ws-icon-tile ws-icon-slate"><Icon name="shield"/></span><div><strong>{counts.suspended}</strong><span>Suspended access</span></div><Icon name="arrow"/></Link>}</div></section>}

    {overview && <section className="ws-card ws-recent-activity" aria-labelledby="activity-heading"><div className="ws-section-heading"><h2 id="activity-heading">Recent workspace activity</h2><Icon name="shield"/></div><ol className="ws-activity">{recentEvents.map((event,index)=><li key={index}><span className="ws-activity-dot"/><div><strong>{accessEventLabel(event.action)}</strong><time dateTime={new Date(event.created_at).toISOString()}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'}).format(new Date(event.created_at))} WAT</time></div></li>)}</ol>{!recentEvents.length && <p className="ws-muted">No workspace activity recorded yet.</p>}</section>}
  </MemberShell>;
}
