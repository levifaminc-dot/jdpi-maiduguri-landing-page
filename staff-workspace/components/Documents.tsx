'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import dynamic from 'next/dynamic';
import Icon from './Icon';
import {documentFolders,PDF_MAX_BYTES} from '../lib/document-policy.mjs';
import type {PdfPreviewDocument} from './PdfViewer';
const PdfViewer=dynamic(()=>import('./PdfViewer'),{ssr:false,loading:()=> <p className="viewer-boot" role="status">Opening PDF preview…</p>});
export type StaffDocument={id:string;title:string;description:string;folder:string;filename:string;bytes:number;pages:number;status:string;version:number;uploader:string;createdAt:string;canManage:boolean};
const size=(bytes:number)=>bytes<1024*1024?`${Math.ceil(bytes/1024)} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;
export default function Documents({records,connected}:{records:StaffDocument[];connected:boolean}) {
  const router=useRouter();const [file,setFile]=useState<File|null>(null),[id,setId]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[preview,setPreview]=useState<PdfPreviewDocument|null>(null),[inputKey,setInputKey]=useState(0);
  async function archive(doc:StaffDocument) {
    const action=doc.status==='ARCHIVED'?'restore':'archive';
    if(busy || !window.confirm(action==='archive'?'Archive this PDF? It will leave the staff library but remain available to its uploader and admins.':'Restore this PDF to the staff library? All approved staff will be able to read it.'))return;
    setBusy(true);setError('');setNotice('');
    try{const r=await fetch('/api/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:doc.id,version:doc.version})});const result=await r.json();if(!r.ok)throw new Error(result.error);setNotice(action==='archive'?'Document archived.':'Document restored.');router.refresh();}catch(e){setError((e as Error).message || 'The document could not be updated.');}finally{setBusy(false);}
  }
  return <>
    <details className="ws-card ws-compose ws-document-upload"><summary><Icon name="upload"/><span>Share a PDF<small>One useful resource can help the whole team.</small></span></summary>
      {!connected?<p className="ws-notice">Private file storage is being connected. No PDF has been uploaded or shared yet.</p>:<form key={inputKey} className="ws-form ws-announcement-form" onSubmit={async event=>{
        event.preventDefault();if(busy || !file)return;
        const form=event.currentTarget,data=new FormData(form),requestId=id||crypto.randomUUID();setId(requestId);data.set('id',requestId);setBusy(true);setUploading(true);setError('');setNotice('');
        try{const r=await fetch('/api/documents',{method:'POST',body:data});const result=await r.json();if(!r.ok)throw new Error(result.error || 'Upload failed.');setFile(null);setId('');setInputKey(key=>key+1);setNotice('Your PDF is now available to approved staff.');router.refresh();}catch(e){setError((e as Error).message || 'Your PDF could not be shared.');}finally{setBusy(false);setUploading(false);}
      }}>
        <p className="ws-notice">Shared with all approved JDPI staff immediately. Use this library for general team resources—not personal, HR, safeguarding or confidential case files. PDF checks are not antivirus scanning.</p>
        <label htmlFor="document-title">Document title</label><input id="document-title" name="title" maxLength={160} required disabled={busy} placeholder="A clear, helpful name for this resource"/>
        <label htmlFor="document-folder">Folder</label><select id="document-folder" name="folder" disabled={busy}>{documentFolders.map((folder:string)=><option key={folder}>{folder}</option>)}</select>
        <label htmlFor="document-description">Short description <span className="ws-field-note">Optional · help colleagues understand when to use this resource.</span></label><textarea id="document-description" name="description" maxLength={1000} rows={2} disabled={busy}/>
        <label htmlFor="document-file">PDF file<span className="ws-field-note" id="document-file-hint">Maximum 3 MB and 200 pages. Password-protected PDFs, scripts and embedded attachments are not supported.</span></label><input id="document-file" name="file" type="file" accept=".pdf,application/pdf" required disabled={busy} aria-describedby="document-file-hint" onChange={event=>{const selected=event.target.files?.[0]||null;setId('');setError('');if(selected && (selected.size>PDF_MAX_BYTES || !/\.pdf$/i.test(selected.name))){setFile(null);event.target.value='';setError('Choose a PDF no larger than 3 MB.');return;}setFile(selected);}}/>
        {file && <div className="ws-selected-file"><span><strong>{file.name}</strong><small>{size(file.size)} · not shared yet</small></span><button type="button" className="ws-button ws-button-quiet" disabled={busy} onClick={()=>setPreview({title:file.name,file,filename:file.name})}>Preview before sharing<Icon name="file"/></button></div>}
        <button className="ws-button" disabled={busy || !file}>{uploading?'Checking & sharing PDF…':'Share with staff'}<Icon name="upload"/></button>
      </form>}
    </details>
    {busy && !uploading && <p className="ws-copy-status" role="status">Updating document…</p>}{error && <p className="ws-notice ws-notice-error" role="alert">{error}</p>}{notice && <p className="ws-copy-status" role="status">{notice}</p>}
    <div className="ws-document-list">{records.map(doc=><article className="ws-card ws-document-card" key={doc.id}><span className="ws-document-symbol" aria-hidden="true"><Icon name="file"/>PDF</span><div className="ws-document-description"><div className="ws-post-labels"><span className="ws-badge ws-badge-neutral">{doc.folder}</span>{doc.status!=='READY' && <span className="ws-badge ws-status-pending">{doc.status==='ARCHIVED'?'Archived':doc.status==='FAILED'?'Upload incomplete':'Upload pending'}</span>}</div><h2>{doc.title}</h2>{doc.description && <p>{doc.description}</p>}<div className="ws-post-meta"><span>Shared by {doc.uploader}</span><span>{size(doc.bytes)} · {doc.pages} {doc.pages===1?'page':'pages'}</span><time dateTime={doc.createdAt}>{new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeZone:'Africa/Lagos'}).format(new Date(doc.createdAt))}</time></div></div><div className="ws-document-actions">{['READY','ARCHIVED'].includes(doc.status) && <button className="ws-button ws-button-quiet" onClick={()=>setPreview({title:doc.title,filename:doc.filename,url:`/api/documents/${doc.id}/file`,downloadUrl:`/api/documents/${doc.id}/file`})}>Preview PDF<Icon name="file"/></button>}{doc.canManage && ['READY','ARCHIVED'].includes(doc.status) && <button className="ws-post-read" disabled={busy} onClick={()=>void archive(doc)}>{doc.status==='ARCHIVED'?'Restore to library':'Archive'}</button>}</div></article>)}</div>
    {preview && <PdfViewer doc={preview} mode={preview.file?'local':'staff'} onClose={()=>setPreview(null)}/>}
  </>;
}
