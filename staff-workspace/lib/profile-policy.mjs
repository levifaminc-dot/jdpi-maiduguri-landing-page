import {normaliseDepartment} from './directory-departments.mjs';
import {directoryEmail} from './directory-import.mjs';
import {workStates} from './directory-states.mjs';

// Shared validation, not authentication. Production resolves actor/capabilities
// from fresh locked membership records, never request input.
export class ProfilePolicyError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
const active=actor=>actor?.status==='ACTIVE' && ['STAFF','ADMIN'].includes(actor.role) && typeof actor.objectId==='string' && actor.objectId.length>0;
export function profilePermissions(actor,profileId) {
  const admitted=active(actor),owner=admitted&&actor.objectId===profileId;
  const professional=admitted&&(actor.role==='ADMIN'||actor.profileEditor===true);
  return {canEditProfessional:professional,canEditPersonal:owner,canEditIntroduction:owner||professional,canManageMembers:admitted&&actor.role==='ADMIN'};
}
const text=(value,max)=>typeof value==='string'&&value.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
const phone=value=>text(value,40)&&(value===''||/^\+?[\d\s().-]+$/.test(value)&&value.replace(/\D/g,'').length>=7&&value.replace(/\D/g,'').length<=15);
const professionalFields=['name','email','title','department','office','state'];
const personalFields=['phone','phoneShared','homeAddress'];
export function applyProfileChanges(actor,profile,patch) {
  if(!active(actor))throw new ProfilePolicyError(403,'Active staff access is required.');
  if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length)throw new ProfilePolicyError(400,'Check your profile details.');
  const permissions=profilePermissions(actor,profile.id);
  const allowed=[...(permissions.canEditProfessional?professionalFields:[]),...(permissions.canEditPersonal?personalFields:[]),...(permissions.canEditIntroduction?['bio']:[])];
  if(Object.keys(patch).some(key=>!allowed.includes(key)))throw new ProfilePolicyError(403,'You cannot change these profile fields.');
  for(const [key,value] of Object.entries(patch)) {
    if(key==='phoneShared'){if(value!==false)throw new ProfilePolicyError(400,'Colleague contact is email-only. Phone numbers remain private.');}
    else if(key==='state'){if(value!==''&&!workStates.includes(value))throw new ProfilePolicyError(400,'Choose Borno, Yobe or Adamawa, or leave the work state unset.');}
    else if(key==='phone'){if(typeof value!=='string'||!phone(value.trim()))throw new ProfilePolicyError(400,'Enter a phone number with 7–15 digits, or leave it blank.');}
    else if(key==='email'){if(typeof value!=='string'||value!==''&&!directoryEmail(value.trim()))throw new ProfilePolicyError(400,'Use a JDPI work email address, or leave it blank.');}
    else if(!text(value,key==='homeAddress'?500:key==='bio'?600:160)||key==='name'&&!value.trim())throw new ProfilePolicyError(400,'Check the length and format of your profile details.');
  }
  const changes=Object.fromEntries(Object.entries(patch).map(([key,value])=>[key,typeof value==='string'?value.trim():value]));
  if('department' in changes)changes.department=normaliseDepartment(changes.department);
  return {...profile,...changes,phoneShared:false};
}

export function profileForViewer(actor,profile) {
  if(!active(actor))throw new ProfilePolicyError(403,'Active staff access is required.');
  const own=actor.objectId===profile.id;
  const result={id:profile.id,name:profile.name,email:profile.email,title:profile.title,department:profile.department,office:profile.office,state:profile.state||'',bio:profile.bio,issues:[...(profile.issues||[])]};
  if(own)Object.assign(result,{phone:profile.phone||'',phoneShared:false,homeAddress:profile.homeAddress||''});
  // Home address is omitted, not merely hidden by CSS, for every other viewer,
  // including a profile editor or administrator. Contact is email-only even for legacy opt-ins.
  return result;
}
