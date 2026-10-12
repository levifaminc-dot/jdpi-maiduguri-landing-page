'use client';
import {useId,useState} from 'react';
export type TagPerson={id:string;name:string;department?:string;state?:string};
export default function StaffTagPicker({people,selected,onChange,disabled=false,purpose='relevance'}:{people:TagPerson[];selected:TagPerson[];onChange:(people:TagPerson[])=>void;disabled?:boolean;purpose?:'relevance'|'access'}) {
  const inputId=useId(),[query,setQuery]=useState('');
  const matches=people.filter(p=>[p.name,p.department||'',p.state||''].some(value=>value.toLowerCase().includes(query.trim().toLowerCase()))).slice(0,12);
  function toggle(person:TagPerson){onChange(selected.some(p=>p.id===person.id)?selected.filter(p=>p.id!==person.id):[...selected,person].slice(0,10));}
  return <fieldset className="ws-staff-picker" disabled={disabled}><legend>Tag colleagues <span className="ws-optional">Optional · up to 10</span></legend>
    <p className="ws-field-note">{purpose==='access'?'Tagged approved colleagues can preview and download this PDF. Removing a tag removes that grant; department or all-staff access may still apply.':'Highlight who this announcement is relevant to. Drafts stay private.'} No automatic email is sent.</p>
    <div className="ws-tag-chips" aria-label="Selected colleagues">{selected.map(person=><button key={person.id} type="button" onClick={()=>toggle(person)} aria-label={`Remove tag for ${person.name}`}>{person.name}<span aria-hidden="true">×</span></button>)}</div>
    <label htmlFor={inputId}>Find a colleague</label><input id={inputId} type="search" value={query} maxLength={100} onChange={event=>setQuery(event.target.value)} placeholder="Search name, department or state" autoComplete="off"/>
    <div className="ws-tag-options">{matches.map(person=>{const checked=selected.some(p=>p.id===person.id);return <label key={person.id}><input type="checkbox" checked={checked} disabled={disabled||!checked&&selected.length>=10} onChange={()=>toggle(person)}/><span><strong>{person.name}</strong>{(person.department||person.state)&&<small>{[person.department,person.state].filter(Boolean).join(' · ')}</small>}</span></label>;})}{!matches.length&&<p className="ws-muted">No matching colleagues.</p>}</div>
    <p className="ws-field-note" aria-live="polite">{selected.length} of 10 colleagues selected{selected.length===10?' · Remove a tag to choose someone else.':''}</p>
  </fieldset>;
}
