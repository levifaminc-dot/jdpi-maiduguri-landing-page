import type {Vacancy} from './content';

export function nigeriaDate(date=new Date()):string {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
    timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit',
  }).formatToParts(date).map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isVacancyOpen(job:Vacancy,today=nigeriaDate()):boolean {
  return job.status==='open' && /^\d{4}-\d{2}-\d{2}$/.test(job.closingDate) && job.closingDate>=today;
}

export function openVacancies(jobs:Vacancy[]|undefined,today=nigeriaDate()):Vacancy[] {
  return (jobs||[]).filter(job=>isVacancyOpen(job,today)).sort((a,b)=>a.closingDate.localeCompare(b.closingDate)||a.title.localeCompare(b.title));
}

export function vacancyApplicationUrl(job:Vacancy):string|undefined {
  if(job.applicationMethod==='link'){
    try{const url=new URL(job.applicationUrl||'');return url.protocol==='https:'&&!url.username&&!url.password?url.href:undefined;}catch{return undefined;}
  }
  if(job.applicationMethod==='email'&&/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(job.applicationEmail||'')){
    const subject=job.referenceCode?`${job.title} — ${job.referenceCode}`:job.title;
    return `mailto:${job.applicationEmail}?subject=${encodeURIComponent(subject)}`;
  }
  return undefined;
}
