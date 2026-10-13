'use client';
import {useEffect,useRef,useState} from 'react';
import Icon from './Icon';
import {workStates} from '../lib/directory-states.mjs';
import {departmentGroups} from '../lib/directory-departments.mjs';
import {directoryInitials} from '../lib/directory-import.mjs';
import {profilePermissions} from '../lib/profile-policy.mjs';
import type {PreviewActor,DirectoryProfile} from './ProfilePreviewDialog';
export type SavedProfile=DirectoryProfile&{version:number;privateVersion?:number};
export default function StaffProfileDialog({profile,actor,onSave,onClose}:{profile:SavedProfile|null;actor:PreviewActor;onSave:(profile:SavedProfile)=>Promise<void>;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),[editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{setEditing(false);setError('');setNotice('');if(profile&&!dialog.current?.open)dialog.current?.showModal();else if(!profile&&dialog.current?.open)dialog.current.close();},[profile?.id]);
  if(!profile)return null;
  const own=actor.objectId===profile.id,permissions=profilePermissions(actor,profile.id);
  function close(){if(busy)return;dialog.current?.close();onClose();}
  async function save(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!profile||busy)return;const form=new FormData(event.currentTarget),patch:Record<string,string>={};
    if(permissions.canEditProfessional)for(const key of ['name','email','title','department','office','state'])patch[key]=String(form.get(key)||'');
    if(permissions.canEditIntroduction)patch.bio=String(form.get('bio')||'');
    if(permissions.canEditPersonal)for(const key of ['phone','homeAddress'])patch[key]=String(form.get(key)||'');
    setBusy(true);setError('');setNotice('');
    try{const response=await fetch('/api/staff-directory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:profile.id,version:profile.version,privateVersion:profile.privateVersion??0,patch})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to save your profile.');await onSave(data);setEditing(false);setNotice('Profile saved.');}
    catch(error){setError(error instanceof Error?error.message:'Unable to save your profile.');}finally{setBusy(false);}
  }
  return <dialog ref={dialog} className="ws-directory-dialog" aria-labelledby="staff-profile-heading" onClose={onClose} onCancel={event=>{if(busy)event.preventDefault();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <div className="ws-directory-dialog-header"><span className="ws-directory-preview-tag">{own?'MY PROFILE':'COLLEAGUE PROFILE'}</span><button className="ws-button ws-button-quiet" disabled={busy} onClick={close}>Close</button></div>
    <div className="ws-directory-profile-intro"><span className="ws-directory-avatar" aria-hidden="true">{directoryInitials(profile.name)}</span><div><h2 id="staff-profile-heading">{profile.name}</h2><p>{profile.title||'Job title to be added'}</p></div></div>
    {editing?<form className="ws-directory-edit" onSubmit={save} aria-busy={busy}>
      <fieldset disabled={busy}><legend>Work profile <span className="ws-optional">Administrator / Profile Editor</span></legend>
        {permissions.canEditProfessional&&['name','title','email'].map(key=><label key={key}>{({name:'Display name',title:'Job title',email:'Work email'} as Record<string,string>)[key]}<input name={key} defaultValue={String(profile[key as keyof SavedProfile]||'')} maxLength={160} required={key==='name'} type={key==='email'?'email':'text'}/></label>)}
        <label>Department<select name="department" defaultValue={profile.department} disabled={!permissions.canEditProfessional}><option value="">Not added yet</option>{departmentGroups.map(group=><option key={group.name}>{group.name}</option>)}</select></label>
        <label>Work state<select name="state" defaultValue={profile.state} disabled={!permissions.canEditProfessional}><option value="">Not confirmed yet</option>{workStates.map(state=><option key={state}>{state}</option>)}</select></label>
        {permissions.canEditProfessional&&<label>Office<input name="office" defaultValue={profile.office} maxLength={160}/></label>}
        <p className="ws-field-note">Work emails are contact details, not sign-in identities. Department changes also update department-based PDF access.</p>
      </fieldset>
      {permissions.canEditIntroduction&&<label>Introduction · optional<textarea name="bio" defaultValue={profile.bio} maxLength={600} rows={3} disabled={busy}/></label>}
      {own&&<fieldset disabled={busy}><legend>My private details · optional</legend><p className="ws-field-note">Visible only to you in the workspace—not to colleagues, profile editors or administrators. Leave blank or clear these fields at any time. They are not used for colleague contact.</p><label>Phone number<input name="phone" type="tel" defaultValue={profile.phone||''} maxLength={40} autoComplete="off"/></label><label>Home address<textarea name="homeAddress" defaultValue={profile.homeAddress||''} maxLength={500} rows={3} autoComplete="off"/></label></fieldset>}
      <div className="ws-inline-actions"><button className="ws-button" disabled={busy} type="submit">{busy?'Saving…':'Save profile'}</button><button className="ws-button ws-button-quiet" disabled={busy} type="button" onClick={()=>{setEditing(false);setError('');}}>Cancel</button></div>
    </form>:<>
      <dl className="ws-directory-profile-details"><div><dt>Department</dt><dd>{profile.department||'Not added yet'}</dd></div><div><dt>Office</dt><dd>{profile.office||'Not added yet'}</dd></div><div><dt>Work state</dt><dd>{profile.state||'Not confirmed yet'}</dd></div><div><dt>Work email</dt><dd>{profile.email?<a href={`mailto:${encodeURIComponent(profile.email)}`}>{profile.email}</a>:'Not added yet'}</dd></div></dl>
      <h3>About</h3><p className="ws-directory-bio">{profile.bio||'An introduction can be added later.'}</p>
      {own&&<section className="ws-profile-private"><h3><Icon name="shield"/>My private details</h3><p>Phone: {profile.phone||'Not added'}</p><p>Home address: {profile.homeAddress||'Not added'}</p><small>Optional and visible only to you in the workspace.</small></section>}
      {(permissions.canEditProfessional||permissions.canEditPersonal)&&<button className="ws-button" onClick={()=>{setEditing(true);setNotice('');}}><Icon name="settings"/>{own?'Edit my profile':'Edit work profile'}</button>}
    </>}
    {error&&<p className="ws-notice ws-notice-error" role="alert">{error}</p>}{notice&&<p className="ws-directory-save-notice" role="status">{notice}</p>}
  </dialog>;
}
