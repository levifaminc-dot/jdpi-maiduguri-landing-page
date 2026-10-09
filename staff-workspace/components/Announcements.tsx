'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Icon from './Icon';
export type Announcement={id:string;title:string;body:string;category:string;status:string;pinned:boolean;commentsEnabled:boolean;version:number;author:string;createdAt:string;publishedAt:string|null;updatedAt:string;commentCount:number;canManage:boolean;canPin:boolean};
export type StaffComment={id:string;body:string|null;author:string;createdAt:string;canRemove:boolean};
const categories=['General','People','Operations','Field updates'];
async function save(body:unknown) {
  const response=await fetch('/api/announcements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error || 'Your changes could not be saved.');
  return data;
}
export function AnnouncementComposer() {
  const router=useRouter();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [id,setId]=useState('');
  return <details className="ws-card ws-compose"><summary><Icon name="plus"/><span>Create an announcement<small>Save a private draft before sharing with staff.</small></span></summary>
    <form className="ws-form ws-announcement-form" onSubmit={async event=>{
      event.preventDefault();if(busy)return;
      const form=new FormData(event.currentTarget);const requestId=id || crypto.randomUUID();setId(requestId);setBusy(true);setError('');
      try {const result=await save({action:'create',id:requestId,title:form.get('title'),body:form.get('body'),category:form.get('category')});router.push(`/workspace/announcements/${result.id}`);router.refresh();}
      catch(e){setError((e as Error).message);setBusy(false);}
    }}>
      <label htmlFor="new-title">Title</label><input id="new-title" name="title" required maxLength={180} placeholder="Give your update a clear title" disabled={busy}/>
      <label htmlFor="new-category">Category</label><select id="new-category" name="category" disabled={busy}>{categories.map(c=><option key={c}>{c}</option>)}</select>
      <label htmlFor="new-body">Your update<span className="ws-field-note">Plain text · up to 12,000 characters. Do not include sensitive case information.</span></label><textarea id="new-body" name="body" rows={7} required maxLength={12000} disabled={busy}/>
      {error && <p className="ws-notice ws-notice-error" role="alert">{error}</p>}
      <button className="ws-button" disabled={busy}>{busy?'Saving draft…':'Save draft'}<Icon name="arrow"/></button>
    </form>
  </details>;
}
export function AnnouncementControls({post}:{post:Announcement}) {
  const router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function action(body:unknown,message:string) {
    if(busy)return;setBusy(true);setError('');setNotice('');
    try{await save(body);setNotice(message);router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const command=(name:string,enabled?:boolean)=>({action:name,id:post.id,version:post.version,...(enabled!==undefined?{enabled}:{})});
  return <section className="ws-card ws-post-admin" aria-label="Announcement controls">
    <div className="ws-section-heading"><h2>Manage this update</h2><span className="ws-badge ws-badge-neutral">{post.canPin?'Admin moderation':'Your update'}</span></div>
    <div className="ws-inline-actions">
      {post.status==='DRAFT' && <button className="ws-button" disabled={busy} onClick={()=>{if(window.confirm('Publish the saved draft to all approved JDPI staff?'))void action(command('publish'),'Announcement published to staff.');}}>Publish saved draft<Icon name="megaphone"/></button>}
      {post.canPin && post.status==='PUBLISHED' && <button className="ws-button ws-button-quiet" disabled={busy} onClick={()=>void action(command('pin',!post.pinned),post.pinned?'Update unpinned.':'Update pinned.')}>{post.pinned?'Unpin update':'Pin update'}<Icon name="pin"/></button>}
      {post.canPin && post.status!=='ARCHIVED' && <button className="ws-button ws-button-quiet" disabled={busy} onClick={()=>void action(command('comments',!post.commentsEnabled),post.commentsEnabled?'Comments closed.':'Comments opened.')}>{post.commentsEnabled?'Close comments':'Open comments'}<Icon name="comment"/></button>}
      {post.status!=='ARCHIVED' ? <button className="ws-button ws-button-quiet" disabled={busy} onClick={()=>{if(window.confirm('Archive this update? It will leave the staff feed, but remain available to its author and admins.'))void action(command('archive'),'Announcement archived.');}}>Archive</button> : <button className="ws-button" disabled={busy} onClick={()=>void action(command('restore'),'Restored to drafts. Review it before publishing again.')}>Restore to drafts</button>}
    </div>
    {notice && <p className="ws-copy-status" role="status">{notice}</p>}{error && <p className="ws-notice ws-notice-error" role="alert">{error}</p>}
    {post.status!=='ARCHIVED' && <details className="ws-edit-update"><summary>Edit saved content</summary><form key={post.version} className="ws-form ws-announcement-form" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);void action({...command('edit'),title:form.get('title'),body:form.get('body'),category:form.get('category')},'Changes saved.');}}>
      <label htmlFor="edit-title">Title</label><input id="edit-title" name="title" defaultValue={post.title} required maxLength={180} disabled={busy}/>
      <label htmlFor="edit-category">Category</label><select id="edit-category" name="category" defaultValue={post.category} disabled={busy}>{categories.map(c=><option key={c}>{c}</option>)}</select>
      <label htmlFor="edit-body">Your update</label><textarea id="edit-body" name="body" defaultValue={post.body} required maxLength={12000} rows={8} disabled={busy}/>
      <button className="ws-button" disabled={busy}>{busy?'Saving…':'Save changes'}</button><p className="ws-field-note">{post.status==='DRAFT'?'Saving does not publish this draft.':'Saved changes update the announcement staff can read.'}</p>
    </form></details>}
  </section>;
}
export function AnnouncementDiscussion({post,comments}:{post:Announcement;comments:StaffComment[]}) {
  const router=useRouter();const [body,setBody]=useState(''),[id,setId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const open=post.status==='PUBLISHED' && post.commentsEnabled;
  async function remove(comment:StaffComment) {
    if(busy || !window.confirm('Remove this comment from the discussion? A removal record will remain.'))return;
    setBusy(true);setError('');setNotice('');
    try {await save({action:'hide-comment',id:comment.id});setNotice('Comment removed.');router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="ws-card ws-discussion" aria-labelledby="discussion-heading"><div className="ws-section-heading"><h2 id="discussion-heading">Discussion</h2><span className="ws-badge ws-badge-neutral">{post.commentCount} comments</span></div>
    <p className="ws-muted">A space to ask questions and share helpful responses. Keep it respectful; never share confidential case or safeguarding details here.</p>
    {open ? <form className="ws-comment-form" onSubmit={async event=>{
      event.preventDefault();if(busy || !body.trim())return;setBusy(true);setError('');setNotice('');const requestId=id||crypto.randomUUID();setId(requestId);
      try{await save({action:'comment',id:requestId,announcementId:post.id,body});setBody('');setId('');setNotice('Your comment has been posted.');router.replace(`/workspace/announcements/${post.id}`,{scroll:false});router.refresh();}
      catch(e){setError((e as Error).message);}finally{setBusy(false);}
    }}><label htmlFor="comment-body">Add your comment</label><textarea id="comment-body" value={body} onChange={e=>setBody(e.target.value)} required maxLength={2000} rows={3} disabled={busy} aria-describedby="comment-hint" placeholder="Join the conversation…"/><div className="ws-comment-submit"><span id="comment-hint" className="ws-muted">{body.length.toLocaleString()} / 2,000 characters</span><button className="ws-button" disabled={busy || !body.trim()}>{busy?'Saving…':'Post comment'}<Icon name="comment"/></button></div></form> : <p className="ws-notice">{post.status==='DRAFT'?'Discussion starts after publication.':post.status==='ARCHIVED'?'This update is archived.':'Comments are closed for this update.'}</p>}
    {notice && <p className="ws-copy-status" role="status">{notice}</p>}{error && <p className="ws-notice ws-notice-error" role="alert">{error}</p>}
    <ol className="ws-comments" aria-label="Recent comments">{comments.map(c=><li key={c.id}><div className="ws-comment-meta"><span className="ws-avatar" aria-hidden="true">{c.author.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('')}</span><div><strong>{c.author}</strong><time dateTime={c.createdAt}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'}).format(new Date(c.createdAt))} WAT</time></div>{c.canRemove && <button className="ws-button ws-button-quiet" disabled={busy} onClick={()=>void remove(c)}>Remove<span className="ws-sr-only"> comment by {c.author}</span></button>}</div><p className={`ws-post-body ${c.body===null?'ws-muted':''}`}>{c.body ?? 'This comment has been removed.'}</p></li>)}</ol>
    {!comments.length && <p className="ws-muted">No comments yet.{open?' Be the first to start the conversation.':''}</p>}
  </section>;
}
