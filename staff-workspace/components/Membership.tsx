'use client';
import {useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import Icon from './Icon';
import {filterMembers, memberCounts, statusLabels} from '../lib/workspace-ui.mjs';
type Member={objectId:string;name:string;role:string;status:string};
type Change={action:string;objectId:string;role?:string};
async function submit(body:unknown) {
  const response=await fetch('/api/membership',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error || 'Change could not be saved.');
  return data;
}
export function AccessRequest({status}:{status:string|null}) {
  const router=useRouter(); const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  if(status==='SUSPENDED') return <p>Your access has been suspended. Contact the designated workspace administrator; a new request cannot restore access.</p>;
  if(status==='PENDING') return <p>Your request is awaiting an administrator’s review. You’ll get access only after approval.</p>;
  const invited=status==='INVITED';
  return <div><p>{invited ? 'An administrator has invited this Microsoft identity. Accept to join as staff.' : 'Request admission using your verified JDPI identity. Only an administrator can approve it.'}</p><button className="button" disabled={busy} onClick={async()=>{setBusy(true);setMessage('');try{await submit({action:invited?'accept':'request'});router.refresh();}catch(error){setMessage((error as Error).message);}finally{setBusy(false);}}}>{busy?'Saving…':invited?'Accept invitation':'Request workspace access'}</button><p role="status">{message}</p></div>;
}
export function MembershipAdmin({members,currentObjectId,initialFilter='ALL'}:{members:Member[];currentObjectId:string;initialFilter?:string}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
  const [filter,setFilter]=useState(initialFilter),[query,setQuery]=useState('');
  const [confirmation,setConfirmation]=useState<{member:Member;body:Change;title:string;description:string;label:string}|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const counts=memberCounts(members);
  const visible:Member[]=filterMembers(members,filter,query);
  const filters=[['ALL','Everyone'],['PENDING','Requests'],['ACTIVE','Active'],['SUSPENDED','Suspended']];
  if(members.some(m=>m.status==='INVITED') || filter==='INVITED') filters.push(['INVITED','Invited']);
  function confirm(member:Member,action:string) {
    const body:Change={action,objectId:member.objectId};
    const nextRole=member.role==='ADMIN'?'STAFF':'ADMIN';
    if(action==='role') body.role=nextRole;
    const detail=action==='admit'?{title:'Approve staff access?',description:'This colleague will be admitted as a staff member. This does not grant admin permissions.',label:'Approve as staff'}:
      action==='restore'?{title:'Restore staff access?',description:'This colleague will regain access as a staff member. Any previous admin role will not be restored.',label:'Restore as staff'}:
      action==='suspend'?{title:'Suspend workspace access?',description:'This colleague will lose workspace access and their workspace sessions will be ended. This does not suspend their Microsoft account.',label:'Suspend access'}:
      {title:`Change role to ${nextRole==='ADMIN'?'administrator':'staff'}?`,description:`${nextRole==='ADMIN'?'Administrators can approve requests, manage roles and suspend members.':'Staff cannot manage membership or roles.'} This change ends the colleague’s workspace sessions.`,label:nextRole==='ADMIN'?'Make administrator':'Make staff'};
    setConfirmation({member,body,...detail}); dialog.current?.showModal();
  }
  async function save() {
    if(!confirmation) return;
    setBusy(true);setMessage('');setFailed(false);
    try {await submit(confirmation.body);setMessage(`Access updated for ${confirmation.member.name}.`);dialog.current?.close();setConfirmation(null);router.refresh();}
    catch(error) {setFailed(true);setMessage((error as Error).message);dialog.current?.close();setConfirmation(null);}
    finally {setBusy(false);}
  }
  return <section aria-label="Member management">
    <div className="ws-filters" role="group" aria-label="Filter members by access status">{filters.map(([value,label])=><button key={value} className="ws-filter" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{value==='ALL'?members.length:members.filter(m=>m.status===value).length}</span></button>)}</div>
    <div className="ws-member-tools"><label htmlFor="member-search" className="ws-search"><Icon name="search"/><span className="ws-sr-only">Search members by name</span><input id="member-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search members by name…" autoComplete="off"/></label><p className="ws-muted" role="status">{visible.length} {visible.length===1?'member':'members'} in this view</p></div>
    {message && <p className={`ws-notice ${failed?'ws-notice-error':''}`} role={failed?'alert':'status'}>{message}</p>}
    <div className="ws-member-list"><div className="ws-member-column-headings" aria-hidden="true"><span>Member</span><span>Access</span><span>Role</span><span>Manage access</span></div>{visible.map(member=>{
      const self=member.objectId===currentObjectId;
      const lastAdmin=member.status==='ACTIVE' && member.role==='ADMIN' && counts.admins===1;
      return <article className="ws-member-row" key={member.objectId} aria-label={`${member.name}, ${statusLabels[member.status as keyof typeof statusLabels]}`}>
        <div className="ws-member-person"><span className="ws-avatar" aria-hidden="true">{member.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase()}</span><div><h2>{member.name} {self && <span className="ws-you">You</span>}</h2><details className="ws-identity-detail"><summary>Microsoft identity</summary><p>Workspace access is matched to this Microsoft identifier in JDPI’s tenant. Use it only if two colleagues share a name.</p><code>{member.objectId}</code></details></div></div>
        <span className={`ws-badge ws-status-${member.status.toLowerCase()}`}>{statusLabels[member.status as keyof typeof statusLabels] || member.status}</span>
        <span className="ws-member-role">{member.role==='ADMIN'?'Administrator':'Staff'}</span>
        <div className="ws-member-actions">{member.status==='PENDING' && <button className="ws-button" disabled={busy} onClick={()=>confirm(member,'admit')}>Approve as staff</button>}{member.status==='SUSPENDED' && <button className="ws-button ws-button-quiet" disabled={busy} onClick={()=>confirm(member,'restore')}>Restore access</button>}{member.status==='ACTIVE' && !lastAdmin && <button className="ws-button ws-button-quiet" disabled={busy} onClick={()=>confirm(member,'role')}>{member.role==='ADMIN'?'Make staff':'Make admin'}</button>}{member.status!=='SUSPENDED' && !lastAdmin && <button className="ws-button ws-button-danger" disabled={busy} onClick={()=>confirm(member,'suspend')}>Suspend</button>}{lastAdmin && <span className="ws-protected"><Icon name="shield"/>Last admin protected</span>}</div>
      </article>;
    })}{!visible.length && <div className="ws-empty"><Icon name={filter==='PENDING'?'check':'users'}/><h2>{query?'No matching members':filter==='PENDING'?'No requests to review':'No members in this view'}</h2><p>{query?'Try a different name or clear your search.':filter==='PENDING'?'When a colleague signs in and requests access, you can review them here.':'Choose another status to see the rest of your team.'}</p>{query && <button className="ws-button ws-button-quiet" onClick={()=>setQuery('')}>Clear search</button>}</div>}</div>
    <p className="ws-help-text"><Icon name="shield"/>Only administrators can change access. The last active administrator is protected from suspension or removal.</p>
    <dialog className="ws-dialog" ref={dialog} aria-labelledby="member-confirm-title" aria-describedby="member-confirm-description" onCancel={e=>{if(busy)e.preventDefault();}} onClose={()=>setConfirmation(null)}><p className="ws-eyebrow">MEMBER ACCESS</p><h2 id="member-confirm-title">{confirmation?.title}</h2><p className="ws-confirm-name">{confirmation?.member.name}</p><p id="member-confirm-description">{confirmation?.description}</p><div className="ws-dialog-actions"><button autoFocus className="ws-button ws-button-quiet" disabled={busy} onClick={()=>dialog.current?.close()}>Cancel</button><button className={`ws-button ${confirmation?.body.action==='suspend'?'ws-button-danger-fill':''}`} disabled={busy} onClick={save}>{busy?'Saving…':confirmation?.label}</button></div></dialog>
  </section>;
}
