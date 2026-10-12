'use client';
import {useEffect,useRef,useState} from 'react';
import Icon from './Icon';
import {workStates} from '../lib/directory-states.mjs';
import {directoryInitials} from '../lib/directory-import.mjs';
import {profileForViewer,profilePermissions} from '../lib/profile-policy.mjs';
export type DirectoryProfile={id:string;name:string;email:string;title:string;department:string;office:string;state:string;bio:string;issues:string[];phone?:string;phoneShared?:boolean;homeAddress?:string};
export type PreviewActor={objectId:string;role:'STAFF'|'ADMIN';status:'ACTIVE';profileEditor:boolean};

export default function ProfilePreviewDialog({profile,actor,departments,onSave,onClose}:{profile:DirectoryProfile|null;actor:PreviewActor;departments:string[];onSave:(patch:Record<string,string|boolean>)=>void;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),[editing,setEditing]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
  useEffect(()=>{setEditing(false);setNotice('');setError('');if(profile&&!dialog.current?.open)dialog.current?.showModal();else if(!profile&&dialog.current?.open)dialog.current.close();},[profile?.id]);
  if(!profile)return null;
  const person=profileForViewer(actor,profile) as DirectoryProfile,permissions=profilePermissions(actor,person.id),own=actor.objectId===person.id;
  const close=()=>{dialog.current?.close();onClose();};
  function save(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=new FormData(event.currentTarget),patch:Record<string,string|boolean>={};
    if(permissions.canEditProfessional)for(const key of ['name','email','title','department','office','state'])patch[key]=String(form.get(key)||'');
    if(permissions.canEditIntroduction)patch.bio=String(form.get('bio')||'');
    if(permissions.canEditPersonal){patch.phone=String(form.get('phone')||'');patch.homeAddress=String(form.get('homeAddress')||'');patch.phoneShared=false;}
    try{onSave(patch);setEditing(false);setError('');setNotice('Preview updated only. Reloading clears these changes.');}catch(error){setError(error instanceof Error?error.message:'Check your profile details.');}
  }
  return <dialog ref={dialog} className="ws-directory-dialog" aria-labelledby="directory-profile-heading" onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <div className="ws-directory-dialog-header"><span className="ws-directory-preview-tag">{own?'MY PROFILE — FICTIONAL SAMPLE':'PREVIEW PROFILE'}</span><button className="ws-button ws-button-quiet" onClick={close}>Close</button></div>
    <div className="ws-directory-profile-intro"><span className="ws-directory-avatar" aria-hidden="true">{directoryInitials(person.name)}</span><div><h2 id="directory-profile-heading">{person.name}</h2><p>{person.title||'Job title to be added'}</p></div></div>
    {editing?<form className="ws-directory-edit" onSubmit={save}>
      <p className="ws-notice">Local permission preview only. Nothing is saved to Microsoft or the database. Do not enter a real home address here.</p>
      <fieldset><legend>Work profile <span className="ws-optional">Administrator / Editor</span></legend>
        {permissions.canEditProfessional&&['name','title','email'].map(key=><label key={key}>{({name:'Name',title:'Job title',email:'Work email'} as Record<string,string>)[key]}<input name={key} defaultValue={String(person[key as keyof DirectoryProfile]||'')} maxLength={key==='email'?254:160} type={key==='email'?'email':'text'}/></label>)}
        <label>Department<select aria-label="Profile department" name="department" defaultValue={person.department} disabled={!permissions.canEditProfessional}><option value="">Not added yet</option>{departments.map(value=><option key={value}>{value}</option>)}</select></label>
        <label>Work state<select aria-label="Profile work state" name="state" defaultValue={person.state} disabled={!permissions.canEditProfessional}><option value="">Not confirmed yet</option>{workStates.map(value=><option key={value}>{value}</option>)}</select></label>
        {permissions.canEditProfessional&&<label>Office<input name="office" defaultValue={person.office} maxLength={160}/></label>}
        {!permissions.canEditProfessional&&<p className="ws-field-note"><Icon name="shield"/>These work details can be changed only by an administrator or profile editor.</p>}
      </fieldset>
      {permissions.canEditIntroduction&&<label>Introduction <span className="ws-optional">Optional</span><textarea name="bio" defaultValue={person.bio} maxLength={600} rows={3}/></label>}
      {permissions.canEditPersonal&&<fieldset><legend>My personal details <span className="ws-optional">Optional</span></legend>
        <label>Phone number · private<input name="phone" type="tel" defaultValue={person.phone||''} maxLength={40} autoComplete="off" placeholder="Use a fictional number for this preview"/></label>
        <p className="ws-field-note">Colleague contact is email-only. Your phone number is never shared.</p>
        <label>Home address<textarea name="homeAddress" defaultValue={person.homeAddress||''} maxLength={500} rows={3} autoComplete="off" placeholder="Use a fictional address for this preview"/><span className="ws-field-note">Private to you. Never shown in the staff directory or to profile editors.</span></label>
      </fieldset>}
      {error&&<p className="ws-notice ws-notice-error" role="alert">{error}</p>}
      <div className="ws-inline-actions"><button className="ws-button" type="submit">Apply preview changes</button><button className="ws-button ws-button-quiet" type="button" onClick={()=>{setEditing(false);setError('');}}>Cancel</button></div>
    </form>:<>
      <dl className="ws-directory-profile-details"><div><dt>Department</dt><dd>{person.department||'Not added yet'}</dd></div><div><dt>Office</dt><dd>{person.office||'Not added yet'}</dd></div><div><dt>Work state</dt><dd>{person.state||'Not confirmed yet'}</dd></div><div><dt>Proposed work email</dt><dd>{person.email?<a href={`mailto:${encodeURIComponent(person.email)}`}>{person.email}</a>:'Not added yet'}</dd></div>
        {person.phone&&<div><dt>Phone number · private</dt><dd>{person.phone}</dd></div>}
      </dl>
      <h3>About</h3><p className="ws-directory-bio">{person.bio||'An introduction can be added later. No personal information is required.'}</p>
      {own&&<section className="ws-profile-private"><h3><Icon name="shield"/>My home address</h3><p>{person.homeAddress||'Not added yet'}</p><small>Only you can view or edit this field. It is excluded from shared profiles.</small></section>}
      {person.issues.length>0&&<p className="ws-notice">Review required: {person.issues.join(', ')}.</p>}
      <p className="ws-directory-preview-note">Preview only. {own?'This fictional profile is not part of the Microsoft export.':'Membership and employment status have not been confirmed.'}</p>
      {(permissions.canEditProfessional||permissions.canEditPersonal)&&<button className="ws-button" onClick={()=>{setEditing(true);setNotice('');}}><Icon name="settings"/>{own?'Edit my profile':'Edit work profile'}</button>}
      {!permissions.canEditProfessional&&!own&&<p className="ws-muted">Staff can edit their own profile. Work-profile changes require an administrator or Editor.</p>}
      {notice&&<p className="ws-directory-save-notice" role="status">{notice}</p>}
    </>}
  </dialog>;
}
