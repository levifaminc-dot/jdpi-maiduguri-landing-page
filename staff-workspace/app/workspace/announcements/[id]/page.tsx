import {notFound} from 'next/navigation';
import Link from 'next/link';
import MemberShell from '../../../../components/MemberShell';
import {AnnouncementControls,AnnouncementDiscussion} from '../../../../components/Announcements';
import Icon from '../../../../components/Icon';
import {requireWorkspacePage} from '../../../../lib/workspace-page';
import {announcementDetail} from '../../../../lib/announcements.mjs';
import {AccessError} from '../../../../lib/membership.mjs';
export const dynamic='force-dynamic';
export default async function AnnouncementPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {identity,member,pool}=await requireWorkspacePage();const {id}=await params;const search=await searchParams;
  const offset=typeof search.offset==='string' && /^\d{1,5}$/.test(search.offset)?Math.min(Number(search.offset),10000):0;
  let data;
  try{data=await announcementDetail(pool,identity,id,offset);}catch(error){if(error instanceof AccessError && [400,404].includes(error.status))notFound();return <MemberShell name={identity.name} role={member.role} page="Announcements"><p className="ws-notice ws-notice-error">This update is temporarily unavailable. Please try again.</p><Link className="ws-button" href="/workspace/announcements" prefetch={false}>Back to announcements</Link></MemberShell>;}
  const post=data.post;
  return <MemberShell name={identity.name} role={member.role} page="Announcements"><div className="ws-announcement-detail"><Link className="ws-back-link" href="/workspace/announcements" prefetch={false}>← Back to announcements</Link>
    <article className="ws-card ws-post-full"><div className="ws-post-labels"><span className="ws-badge ws-badge-neutral">{post.category}</span>{post.pinned && <span className="ws-badge"><Icon name="pin"/>Pinned</span>}{post.status!=='PUBLISHED' && <span className="ws-badge ws-status-pending">{post.status==='DRAFT'?'Private draft':'Archived · author & admins'}</span>}</div><h1>{post.title}</h1><div className="ws-post-meta"><span>Shared by {post.author}</span><time dateTime={post.publishedAt || post.createdAt}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'}).format(new Date(post.publishedAt || post.createdAt))} WAT</time></div><p className="ws-post-body">{post.body}</p></article>
    {post.canManage && <AnnouncementControls post={post}/>}
    <AnnouncementDiscussion post={post} comments={data.comments}/>
    <nav className="ws-inline-actions" aria-label="Discussion pages">{offset>0 && <Link className="ws-button ws-button-quiet" href={`/workspace/announcements/${id}?offset=${Math.max(0,offset-50)}`} prefetch={false}>Newer comments</Link>}{data.hasMoreComments && offset<10000 && <Link className="ws-button ws-button-quiet" href={`/workspace/announcements/${id}?offset=${offset+50}`} prefetch={false}>Older comments</Link>}</nav>
  </div></MemberShell>;
}
