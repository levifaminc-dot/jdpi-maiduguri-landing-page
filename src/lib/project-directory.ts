import type {ContentItem} from './content';

// Details from JDPI's supplied project-page template (IMG_2713.PNG).
// Editor fields take precedence. New projects receive no invented metadata.
const templateDetails: Record<string, {
  status:'completed'; startDate:string; endDate:string; location:string;
  tags:string[]; facts:{value:string; label:string}[];
}> = {
  'bmz-multisectoral-resilience-project': {
    status:'completed',startDate:'2022-11-01',endDate:'2026-08-31',location:'Hong & Michika, Adamawa State',
    tags:['FSL','Nutrition','WaSH','Protection','MHPSS','SCPB'],
    facts:[{value:'204,161',label:'People reached'},{value:'20',label:'Communities'}],
  },
  'echf-into-mami-project': {
    status:'completed',startDate:'2024-04-01',endDate:'2026-09-30',location:'Jere & Magumeri, Borno State',tags:['Nutrition','WaSH'],
    facts:[{value:'16,000+',label:'People reached'},{value:'10',label:'Boreholes rehabilitated'}],
  },
  'nhf-integrated-nutrition-and-protection': {
    status:'completed',startDate:'2025-11-01',endDate:'2026-05-31',location:'Madagali, Adamawa State',tags:['Nutrition','Protection'],
    facts:[{value:'4',label:'Communities'},{value:'900',label:'Birth registrations'}],
  },
  'allright-project': {
    status:'completed',startDate:'2023-06-01',endDate:'2026-08-31',location:'Hong & Michika, Adamawa State',tags:['IGA / VT','SILC'],
    facts:[{value:'3,400',label:'People supported'},{value:'110',label:'SILC groups'}],
  },
};
const programmeTags: Record<string,string> = {
  'food-security-and-livelihoods':'FSL','nutrition':'Nutrition','water-sanitation-and-hygiene':'WaSH','protection':'Protection',
  'mental-health-and-psychosocial-support':'MHPSS','peacebuilding-and-social-cohesion':'SCPB','economic-empowerment':'Economic empowerment',
};
const month=(date:string)=>new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date));
export function directoryDetails(project:ContentItem){
  const fallback=templateDetails[project.slug];
  const startDate=project.startDate || fallback?.startDate;
  const endDate=project.endDate || fallback?.endDate;
  return {
    status:project.status || fallback?.status,location:project.location || fallback?.location,
    dateLabel:startDate && endDate ? `${month(startDate)} – ${month(endDate)}` : startDate ? `From ${month(startDate)}` : endDate ? `Until ${month(endDate)}` : undefined,
    startTime:startDate ? Date.parse(startDate) : 0,
    tags:project.projectProgrammes ? project.projectProgrammes.filter(p=>p?.title).map(p=>programmeTags[p.slug] || p.title) : fallback?.tags || [],
    facts:project.impactFacts ?? fallback?.facts ?? [],
  };
}
export function tagTone(tag:string){
  if(['Nutrition','SCPB'].includes(tag))return 'coral';
  if(tag==='WaSH')return 'blue';
  if(['Protection','MHPSS','IGA / VT'].includes(tag))return 'violet';
  if(tag==='SILC')return 'sand';
  return 'mint';
}
