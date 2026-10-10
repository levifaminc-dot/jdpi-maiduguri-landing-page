import type {ContentItem, ContentImage} from './content';
import {getResourceLibrary,getPublishedResources,type ResourceRecord} from './resources.ts';
import type {SiteContent} from './content';
export const updateFilters=[
  {value:'all',label:'All updates'},{value:'field',label:'Field stories'},
  {value:'blog',label:'Blog posts'},{value:'news',label:'News & events'},
  {value:'reports',label:'Reports'},{value:'publications',label:'Publications'},
] as const;
export type UpdateCategory=Exclude<typeof updateFilters[number]['value'],'all'>;
export interface UpdateRecord {
  key:string; title:string; summary?:string; image?:ContentImage;
  category:UpdateCategory; label:string; url:string; publishedAt?:string;
  year?:number; document:boolean;
}
const categories:Record<string,{category:UpdateCategory;label:string}>={
  Stories:{category:'field',label:'Field story'},Blogs:{category:'blog',label:'Blog post'},
  News:{category:'news',label:'News'},Events:{category:'news',label:'Event'},
  Publications:{category:'publications',label:'Publication'},
};
export const storyCategory=(category?:string)=>categories[category||'']||{category:'news' as const,label:'Update'};
// Preserve existing CMS categories; documents reuse the deduplicated resource library.
export function getUpdates(stories:ContentItem[],reports:ContentItem[],base?:ResourceRecord[]):UpdateRecord[]{
  const updates:UpdateRecord[]=stories.map(story=>({
    key:`story-${story.slug}`,title:story.title,summary:story.summary||undefined,
    image:story.image,...storyCategory(story.category),
    url:`/stories/${encodeURIComponent(story.slug)}/`,publishedAt:story.publishedAt,document:false,
  }));
  for(const report of getResourceLibrary(reports,base))updates.push({
    key:`document-${report.fileUrl}`,title:report.title,summary:report.summary,
    category:report.category==='Publications'&&!/\breport\b/i.test(report.title)?'publications':'reports',
    label:report.category==='Annual reports'?'Annual report':report.category==='Financial reports'?'Financial report':/\breport\b/i.test(report.title)?'Report':'Publication',
    url:report.fileUrl,year:report.year,document:true,
  });
  // A reporting year is not represented as an invented publication date.
  const rank=(item:UpdateRecord)=>item.publishedAt?Date.parse(item.publishedAt):item.year?Date.UTC(item.year,0,1):0;
  return updates.sort((a,b)=>rank(b)-rank(a)||a.title.localeCompare(b.title));
}
export const getWebsiteUpdates=(content:SiteContent)=>getUpdates(content.stories,content.reports,getPublishedResources(content));
