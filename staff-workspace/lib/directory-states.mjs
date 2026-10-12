// Work-state inference uses office locations only, never residential fields.
// Ambiguous labels (including Uba, Salama and generic Head Office) stay unset.
export const workStates=['Borno','Yobe','Adamawa'];
const offices=new Map([
  ['bama','Borno'],['pulka','Borno'],['kaga','Borno'],['maiduguri','Borno'],['maiduguri - roving','Borno'],
  ['damaturu','Yobe'],['damaturu office','Yobe'],['potiskum','Yobe'],
  ['mubi','Adamawa'],['mubi office','Adamawa'],['michika','Adamawa'],
]);
export function stateForOffice(office){return offices.get(String(office??'').trim().replace(/\s+/g,' ').toLowerCase())||'';}
