'use client';
import StaffTagPicker,{type TagPerson} from './StaffTagPicker';
import {departmentGroups} from '../lib/directory-departments.mjs';
export default function DocumentAudiencePicker({people,selected,onChange,mode,onModeChange,departments,onDepartmentsChange,disabled=false}:{people:TagPerson[];selected:TagPerson[];onChange:(people:TagPerson[])=>void;mode:string;onModeChange:(mode:string)=>void;departments:string[];onDepartmentsChange:(departments:string[])=>void;disabled?:boolean}){
  return <fieldset className="ws-staff-picker" disabled={disabled}><legend>Who can read this PDF?</legend><label>Audience<select value={mode} onChange={event=>{onModeChange(event.target.value);if(event.target.value==='ALL_STAFF'){onChange([]);onDepartmentsChange([]);}}}><option value="SELECTED">Selected colleagues and departments</option><option value="ALL_STAFF">All approved staff</option></select></label>
    <p className="ws-field-note">{mode==='ALL_STAFF'?'Every approved staff member can preview and download this PDF.':'Only its uploader, admins, tagged approved colleagues and selected departments can preview or download it. No selection means uploader/admin-only.'}</p>
    {mode==='SELECTED'&&<><StaffTagPicker people={people} selected={selected} onChange={onChange} disabled={disabled} purpose="access"/><details><summary>Department audience · {departments.length} selected</summary><div className="ws-tag-options">{departmentGroups.map(group=><label key={group.name}><input type="checkbox" checked={departments.includes(group.name)} onChange={()=>onDepartmentsChange(departments.includes(group.name)?departments.filter(name=>name!==group.name):[...departments,group.name])}/><span>{group.name}</span></label>)}</div></details></>}
  </fieldset>;
}
