import type {ContentItem,SiteContent} from './content';
import {pageEditor} from './page-editor.ts';

export interface ResourceRecord {
  title:string; category:'Annual reports'|'Financial reports'|'Publications';
  year?:number; summary:string; fileUrl:string; onlineUrl?:string;
}
// Public links observed on JDPI's WordPress resources page; checked 6 October 2026.
export const wordpressResourceSource='https://jdpimaiduguri.org/recources/';
const wordpressReports:ResourceRecord[]=[
  {title:'JDPI Annual Report 2025',category:'Annual reports',year:2025,
    summary:'Programme activities, outcomes and community stories from January to December 2025 across Northeast Nigeria.',
    fileUrl:'https://jdpimaiduguri.org/wp-content/uploads/2026/09/JDPI-Maiduguri-2025-Annual-Report-Protected.pdf',
    onlineUrl:'https://heyzine.com/flip-book/fbc150516f.html'},
  {title:'JDPI Financial Report 2025',category:'Financial reports',year:2025,
    summary:'The 2025 financial-report document published in JDPI’s audited financial reports collection.',
    fileUrl:'https://jdpimaiduguri.org/wp-content/uploads/2026/09/AUDIT-REPORT-AS-AT-SEPT-2025.pdf'},
  {title:'JDPI Financial Report 2024',category:'Financial reports',year:2024,
    summary:'The 2024 financial-report document published in JDPI’s audited financial reports collection.',
    fileUrl:'https://jdpimaiduguri.org/wp-content/uploads/2026/09/JDPC-Audit-report-Sept.-2024.pdf'},
  {title:'JDPI Financial Report 2023',category:'Financial reports',year:2023,
    summary:'The 2023 financial-report document published in JDPI’s audited financial reports collection.',
    fileUrl:'https://jdpimaiduguri.org/wp-content/uploads/2026/09/AUDIT-REPORT-2023-1.pdf'},
];
export function safeResourceUrl(value?:string):string|undefined {
  if(!value)return;
  if(/^\/assets\/sanity\/[a-zA-Z0-9.-]+$/.test(value))return value;
  try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
}
const titleKey=(title:string)=>title.toLowerCase().replace(/\bfinance\b/g,'financial').replace(/[^a-z0-9]+/g,' ').trim();
export function getResourceLibrary(reports:ContentItem[],base:ResourceRecord[]=wordpressReports):ResourceRecord[] {
  const records=base.map(report=>({...report,fileUrl:safeResourceUrl(report.fileUrl)||'',onlineUrl:safeResourceUrl(report.onlineUrl)})).filter(report=>report.fileUrl);
  for(const report of reports){
    const fileUrl=safeResourceUrl(report.fileUrl);
    if(!fileUrl)continue;
    const category:ResourceRecord['category']=/financial|finance|audit/i.test(report.title)?'Financial reports':/annual/i.test(report.title)?'Annual reports':'Publications';
    const titleYear=report.title.match(/\b(20\d{2})\b/);
    const publishedYear=report.publishedAt?new Date(report.publishedAt).getUTCFullYear():NaN;
    const year=titleYear?Number(titleYear[1]):Number.isFinite(publishedYear)?publishedYear:undefined;
    const existing=records.findIndex(record=>record.fileUrl===fileUrl||titleKey(record.title)===titleKey(report.title));
    const previous=existing>=0?records[existing]:undefined;
    const next={title:report.title,category,year,summary:report.summary||previous?.summary||'A publication from JDPI Maiduguri.',fileUrl,onlineUrl:previous?.onlineUrl};
    if(existing>=0)records[existing]=next;else records.push(next);
  }
  return records.sort((a,b)=>(b.year||0)-(a.year||0)||a.title.localeCompare(b.title));
}
export function getPublishedResources(content:SiteContent){
  return getResourceLibrary(content.reports,pageEditor(content,'resources').data<ResourceRecord[]|undefined>('legacyReports',undefined));
}
