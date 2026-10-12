import Link from 'next/link';
import MemberShell,{PageHeading} from '../../../components/MemberShell';
import Documents from '../../../components/Documents';
import type {StaffDocument} from '../../../components/Documents';
import Icon from '../../../components/Icon';
import {requireWorkspacePage} from '../../../lib/workspace-page';
import {documentFeed} from '../../../lib/documents.mjs';
import {privateStorage} from '../../../lib/private-storage.mjs';
import {documentFolders} from '../../../lib/document-policy.mjs';
export const dynamic='force-dynamic';
export default async function DocumentsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {identity,member,pool}=await requireWorkspacePage();const search=await searchParams;
  const view=typeof search.view==='string' && ['mine','archive'].includes(search.view)?search.view:'library';
  const folder=typeof search.folder==='string' && documentFolders.includes(search.folder)?search.folder:'';
  const query=typeof search.q==='string'?search.q.slice(0,100):'';
  const offset=typeof search.offset==='string' && /^\d{1,5}$/.test(search.offset)?Math.min(Number(search.offset),10000):0;
  let feed:{documents:StaffDocument[];hasMore:boolean}|null=null;
  try{feed=await documentFeed(pool,identity,{view,folder,query,offset});}catch{}
  const href=(next:number)=>`/workspace/documents?${new URLSearchParams({view,folder,q:query,offset:String(next)})}`;
  return <MemberShell name={identity.name} role={member.role} page="Documents"><PageHeading eyebrow="OUR SHARED KNOWLEDGE" title="Useful resources. Within reach." description="Find guidance, templates and learning from across JDPI. Preview a PDF here before choosing to download it."/>
    <div className="ws-document-layout"><section className="ws-document-main">
      <nav className="ws-filters" aria-label="Document views">{[['library','Staff library'],['mine','My uploads'],['archive',member.role==='ADMIN'?'Archive':'My archive']].map(([value,label])=><Link key={value} className="ws-filter" href={`/workspace/documents?view=${value}`} aria-current={value===view?'page':undefined} prefetch={false}>{label}</Link>)}</nav>
      <form action="/workspace/documents" className="ws-document-search" role="search"><input type="hidden" name="view" value={view}/><label className="ws-search" htmlFor="document-search"><Icon name="search"/><span className="ws-sr-only">Search documents</span><input id="document-search" name="q" type="search" maxLength={100} defaultValue={query} placeholder="Search by title or description…"/></label><label className="ws-document-folder" htmlFor="folder-filter"><span className="ws-sr-only">Filter document folder</span><select id="folder-filter" name="folder" defaultValue={folder}><option value="">All folders</option>{documentFolders.map((value:string)=><option key={value}>{value}</option>)}</select></label><button className="ws-button ws-button-quiet">Find</button>{(query || folder) && <Link className="ws-button ws-button-quiet" href={`/workspace/documents?view=${view}`} prefetch={false}>Clear</Link>}</form>
      <Documents records={feed?.documents||[]} connected={!!privateStorage() && !!feed} taggingEnabled={process.env.STAFF_TAGGING_ENABLED==='true'}/>
      {!feed?<p className="ws-notice ws-notice-error" role="alert">The document library is temporarily unavailable. Please try again shortly.</p>:!feed.documents.length?<section className="ws-card ws-empty"><Icon name="folder"/><h2>{query || folder?'No matching documents':view==='mine'?'Your uploads will appear here':view==='archive'?'No archived documents':'Knowledge grows when we share it.'}</h2><p>{query || folder?'Try another title or clear the filters.':view==='library'?'Share the first useful PDF using the form above. Choose the colleagues or departments who may read it, or explicitly select all staff.':'Archived and incomplete uploads are kept out of the staff library.'}</p></section>:null}
      <nav className="ws-inline-actions" aria-label="Document pages">{offset>0 && <Link className="ws-button ws-button-quiet" href={href(Math.max(0,offset-20))} prefetch={false}>Previous documents</Link>}{feed?.hasMore && offset<10000 && <Link className="ws-button ws-button-quiet" href={href(offset+20)} prefetch={false}>More documents<Icon name="arrow"/></Link>}</nav>
    </section><aside className="ws-card ws-document-guide"><span className="ws-icon-tile"><Icon name="file"/></span><h2>Preview first.<br/>Find what matters.</h2><p>Read PDFs without leaving the workspace. Move between pages, zoom in or search for a phrase.</p><ul><li>Approved staff can share with colleagues.</li><li>PDF access follows the chosen audience.</li><li>Admins can archive unsuitable files.</li><li>Private case and HR files do not belong here.</li></ul><span className="ws-badge ws-badge-neutral"><Icon name="shield"/>JDPI staff only</span></aside></div>
  </MemberShell>;
}
