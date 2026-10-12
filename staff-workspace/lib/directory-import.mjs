// Pure import preparation. This module never changes membership or contacts a provider.
import {normaliseDepartment} from './directory-departments.mjs';
import {stateForOffice} from './directory-states.mjs';
const clean=(value,max=160)=>String(value ?? '').trim().replace(/\s+/g,' ').slice(0,max);
export const directoryEmail=value=>typeof value==='string' && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@jdpimaiduguri\.org$/i.test(value) && value.length<=254 && !/[\r\n\u0000-\u001f]/.test(value);

export function parseDirectoryCsv(input) {
  if(typeof input!=='string' || Buffer.byteLength(input)>1024*1024) throw new Error('Choose a Microsoft CSV export no larger than 1 MB.');
  const text=input.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false,closed=false;
  const pushField=()=>{row.push(field);field='';closed=false;};
  const pushRow=()=>{pushField();if(row.some(value=>value!==''))rows.push(row);row=[];};
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c==='"'){if(field || closed)throw new Error('The CSV has invalid quoted fields.');quoted=true;}
    else if(c===',')pushField();
    else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;pushRow();}
    else{if(closed)throw new Error('The CSV has invalid quoted fields.');field+=c;}
  }
  if(quoted)throw new Error('The CSV has an unfinished quoted field.');
  if(field || row.length || closed)pushRow();
  if(rows.length<2 || rows.length>1001)throw new Error('Choose a CSV containing between 1 and 1,000 accounts.');
  const headers=rows.shift().map(value=>value.trim());
  if(new Set(headers).size!==headers.length || !['Display name','User principal name','Object Id'].every(key=>headers.includes(key)))throw new Error('Choose the original Microsoft user export with name, sign-in address and Object Id columns.');
  if(rows.some(values=>values.length!==headers.length))throw new Error('The CSV contains a row with unexpected columns.');
  return rows.map(values=>Object.fromEntries(headers.map((key,i)=>[key,values[i]])));
}

export function prepareDirectoryPreview(rows) {
  const guest=row=>/#ext#/i.test(String(row['User principal name']??'')) || ['guest'].includes(clean(row.MemberType||row['User type']).toLowerCase());
  const retained=rows.map((row,index)=>({row,index})).filter(({row})=>!guest(row));
  const emails=new Map(),ids=new Map();
  for(const {row} of retained){const email=clean(row['User principal name'],254).toLowerCase(),oid=clean(row['Object Id']).toLowerCase();emails.set(email,(emails.get(email)||0)+1);ids.set(oid,(ids.get(oid)||0)+1);}
  const profiles=retained.map(({row,index})=>{
    const address=clean(row['User principal name'],254),oid=clean(row['Object Id']);const issues=[];
    if(!directoryEmail(address))issues.push('Not a JDPI work address');
    const blocked=clean(row['Block credential']).toLowerCase();
    if(blocked==='true')issues.push('Sign-in blocked');
    else if(blocked && blocked!=='false')issues.push('Review sign-in status');
    if(emails.get(address.toLowerCase())>1 || ids.get(oid.toLowerCase())>1)issues.push('Duplicate account');
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oid))issues.push('Invalid account identifier');
    if(!clean(row['Display name']))issues.push('Missing name');
    // Allowlist for the local browser. Never include OIDs, phones, addresses,
    // licences, birthdays, password/account timestamps or raw source records.
    const sourceName=clean(row['Display name']);
    const name=sourceName.includes('@')?`Account ${index+1} — name needs review`:sourceName||'Unnamed account';
    return {id:`preview-${index+1}`,name,email:directoryEmail(address)?address:'',title:clean(row.Title),department:normaliseDepartment(row.Department),office:clean(row.Office),state:stateForOffice(row.Office),bio:'',issues};
  });
  profiles.sort((a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base'}));
  return {profiles,summary:{total:profiles.length,guestsExcluded:rows.length-retained.length,candidates:profiles.filter(p=>!p.issues.length).length,review:profiles.filter(p=>p.issues.length).length,titles:profiles.filter(p=>p.title).length,departments:profiles.filter(p=>p.department).length,offices:profiles.filter(p=>p.office).length}};
}

export function filterDirectory(profiles,{query='',department='',office='',state='',scope='candidates'}={}) {
  const needle=query.trim().toLocaleLowerCase('en');
  return profiles.filter(p=>(scope==='all'||(scope==='review'?p.issues.length>0:p.issues.length===0)) && (!department||normaliseDepartment(p.department)===normaliseDepartment(department)) && (!office||p.office===office) && (!state||(state==='unset'?!p.state:p.state===state)) && (!needle||[p.name,p.title,p.department,p.office,p.email,p.state||''].some(value=>value.toLocaleLowerCase('en').includes(needle))||normaliseDepartment(p.department).toLocaleLowerCase('en')===normaliseDepartment(query).toLocaleLowerCase('en')));
}

export function directoryInitials(name){return name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();}
