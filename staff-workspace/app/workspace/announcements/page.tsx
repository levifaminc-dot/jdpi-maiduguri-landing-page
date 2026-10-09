import Link from 'next/link';
import MemberShell,{PageHeading} from '../../../components/MemberShell';
import {AnnouncementComposer} from '../../../components/Announcements';
import type {Announcement} from '../../../components/Announcements';
import Icon from '../../../components/Icon';
import {requireWorkspacePage} from '../../../lib/workspace-page';
import {announcementFeed} from '../../../lib/announcements.mjs';
export const dynamic='force-dynamic';
export default async function AnnouncementsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {identity,member,pool}=await requireWorkspacePage();
  const admin=member.role==='ADMIN';const search=await searchParams;
  const raw=typeof search.status==='string'?search.status:'PUBLISHED';
  const status=['DRAFT','ARCHIVED'].includes(raw)?raw:'PUBLISHED';
  const query=typeof search.q==='string'?search.q.slice(0,100):'';
  const offset=typeof search.offset==='string' && /^\d{1,5}$/.test(search.offset)?Math.min(Number(search.offset),10000):0;
  let feed:{posts:Announcement[];hasMore:boolean}|null=null;
  try{feed=await announcementFeed(pool,identity,{status,query,offset});}catch{/* Fail closed; never substitute sample announcements. */}
  const href=(next:number)=>`/workspace/announcements?${new URLSearchParams({status,q:query,offset:String(next)})}`;
  return <MemberShell name={identity.name} role={member.role} page="Announcements"><PageHeading eyebrow="THE TEAM NOTICEBOARD" title="Stay connected." description="Important updates, shared knowledge and conversations that bring our team together."/>
    <div className="ws-announcement-layout"><div className="ws-announcement-main">
      <AnnouncementComposer/>
      <nav className="ws-filters" aria-label="Announcement views">{[['PUBLISHED','Staff updates'],['DRAFT',admin?'Drafts':'My drafts'],['ARCHIVED',admin?'Archived':'My archive']].map(([value,label])=><Link key={value} className="ws-filter" prefetch={false} href={`/workspace/announcements?status=${value}`} aria-current={status===value?'page':undefined}>{label}</Link>)}</nav>
      <form action="/workspace/announcements" className="ws-feed-search" role="search"><input type="hidden" name="status" value={status}/><label className="ws-search" htmlFor="announcement-search"><Icon name="search"/><span className="ws-sr-only">Search announcements</span><input id="announcement-search" name="q" type="search" maxLength={100} defaultValue={query} placeholder="Search team updates…"/></label><button className="ws-button ws-button-quiet">Search</button>{query && <Link className="ws-button ws-button-quiet" href={`/workspace/announcements?status=${status}`} prefetch={false}>Clear</Link>}</form>
      {!feed ? <p className="ws-notice ws-notice-error" role="alert">Announcements are temporarily unavailable. Please refresh or try again shortly.</p> : <>
        <div className="ws-announcement-feed">{feed.posts.map(post=><article className="ws-card ws-announcement-card" key={post.id}><div className="ws-post-labels"><span className="ws-badge ws-badge-neutral">{post.category}</span>{post.pinned && <span className="ws-badge"><Icon name="pin"/>Pinned</span>}{post.status!=='PUBLISHED' && <span className="ws-badge ws-status-pending">{post.status==='DRAFT'?'Private draft':'Archived · author & admins'}</span>}</div><h2><Link href={`/workspace/announcements/${post.id}`} prefetch={false}>{post.title}</Link></h2><p className="ws-post-excerpt">{post.body}{post.body.length===240?'…':''}</p><div className="ws-post-meta"><span>{post.author}</span><time dateTime={post.publishedAt || post.createdAt}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'Africa/Lagos'}).format(new Date(post.publishedAt || post.createdAt))}</time><span><Icon name="comment"/>{post.commentCount}</span></div><Link className="ws-post-read" href={`/workspace/announcements/${post.id}`} prefetch={false}>Read update & discussion<Icon name="arrow"/></Link></article>)}</div>
        {!feed.posts.length && <section className="ws-card ws-empty"><Icon name="megaphone"/><h2>{query?'No matching updates':status==='DRAFT'?'No drafts yet':status==='ARCHIVED'?'No archived updates':'Your noticeboard starts here'}</h2><p>{query?'Try another search or clear the filter.':status==='PUBLISHED'?'Published team updates will appear here.':'Drafts and archived updates are visible only to their author and administrators.'}</p></section>}
        <nav className="ws-inline-actions" aria-label="Announcement pages">{offset>0 && <Link className="ws-button ws-button-quiet" href={href(Math.max(0,offset-20))} prefetch={false}>Previous updates</Link>}{feed.hasMore && offset<10000 && <Link className="ws-button ws-button-quiet" href={href(offset+20)} prefetch={false}>More updates<Icon name="arrow"/></Link>}</nav>
      </>}
    </div><aside className="ws-card ws-noticeboard-guide"><span className="ws-icon-tile"><Icon name="heart"/></span><h2>One team.<br/>Everyone heard.</h2><p>Every approved staff member can share updates and join discussions. Administrators keep the noticeboard helpful and respectful.</p><ul><li>Keep replies kind and useful.</li><li>Protect confidential information.</li><li>Contact your designated officer privately for sensitive concerns.</li></ul><span className="ws-badge ws-badge-neutral"><Icon name="shield"/>JDPI staff only</span></aside></div>
  </MemberShell>;
}
