// Professional-label aliases only. A department never determines access roles.
// Keep combined departments and programme-specific teams distinct.
export const departmentGroups=Object.freeze([
  {name:'Administration',aliases:['Admin','Administration']},
  {name:'ALLRight',aliases:['Alright','AllRight','ALLRight']},
  {name:'Finance',aliases:['Finance']},
  {name:'Food Security & Livelihoods',aliases:['FSL','Food Security Livelihood','Food Security and Livelihood','Food Security and Livielihood','Food Security and Livelihoods','Food Security & Livelihoods']},
  {name:'Household Strengthening',aliases:['Household Strengthening','Household Streengthening']},
  {name:'ICT',aliases:['ICT']},
  {name:'MEAL',aliases:['MEAL']},
  {name:'MHPSS',aliases:['MHPSS']},
  {name:'Nutrition',aliases:['Nutrition','Nutrtion']},
  {name:'Operations',aliases:['Operations']},
  {name:'Procurement & Logistics',aliases:['Procurement and Logistics','Procurement/Logistics','Procurement & Logistics']},
  {name:'Programmes',aliases:['Program','Programme','Programs','Programmes']},
  {name:'Protection',aliases:['Protection']},
  {name:'Protection & MHPSS',aliases:['MHPSS and Protection','Protection and MHPSS','Protection & MHPSS']},
  {name:'SILC',aliases:['SILC']},
  {name:'Safety & Security',aliases:['Safety and Security','Safety & Security','Security']},
  {name:'WaSH',aliases:['WaSH','WaSh','WASH']},
].map(group=>Object.freeze({...group,aliases:Object.freeze(group.aliases)})));
const clean=value=>String(value ?? '').trim().replace(/\s+/g,' ').slice(0,160);
const key=value=>clean(value).toLocaleLowerCase('en').replace(/\s*[&/]\s*/g,' and ').replace(/\s+/g,' ');
const aliases=new Map(departmentGroups.flatMap(group=>[group.name,...group.aliases].map(value=>[key(value),group.name])));

export function normaliseDepartment(value) {
  const label=clean(value);
  // New/unknown departments are retained, not reassigned by a fuzzy guess.
  return aliases.get(key(label)) ?? label;
}

export function departmentOptions(profiles) {
  return [...new Set(profiles.map(profile=>normaliseDepartment(profile.department)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'en'));
}
