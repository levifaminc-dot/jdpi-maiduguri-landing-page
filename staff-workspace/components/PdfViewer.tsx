'use client';
import {useEffect,useRef,useState} from 'react';
import type {PDFDocumentProxy,RenderTask} from 'pdfjs-dist';
import type {DocumentRecord} from '../lib/sample-data';
export default function PdfViewer({doc,onClose}:{doc:DocumentRecord;onClose:()=>void}) {
  const modal = useRef<HTMLDialogElement>(null), canvas = useRef<HTMLCanvasElement>(null), scroller = useRef<HTMLDivElement>(null);
  const [pdf,setPdf] = useState<PDFDocumentProxy|null>(null), [page,setPage] = useState(1), [zoom,setZoom] = useState(1), [error,setError] = useState(''), [loading,setLoading] = useState(true), [search,setSearch] = useState(''), [matches,setMatches] = useState<{page:number;count:number}[]>([]), [searching,setSearching] = useState(false);
  const [downloadUrl,setDownloadUrl] = useState(doc.url || '');
  const [hasSearched,setHasSearched] = useState(false), [viewerWidth,setViewerWidth] = useState(700);
  useEffect(() => {modal.current?.showModal();}, []);
  useEffect(() => {
    if (!scroller.current) return;
    const observer = new ResizeObserver(([entry]) => setViewerWidth(entry.contentRect.width));
    observer.observe(scroller.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!doc.file) return;
    const url = URL.createObjectURL(doc.file); setDownloadUrl(url); return () => URL.revokeObjectURL(url);
  }, [doc.file]);
  useEffect(() => {
    let disposed = false, document:PDFDocumentProxy|undefined, task:ReturnType<typeof import('pdfjs-dist').getDocument>|undefined;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const source = doc.file ? {data:new Uint8Array(await doc.file.arrayBuffer())} : {url:doc.url!};
        task = pdfjs.getDocument({...source,enableXfa:false,standardFontDataUrl:'/pdf-standard-fonts/'});
        document = await task.promise;
        if (disposed) {await task.destroy(); return;} setPdf(document);
      } catch {if (!disposed) {setError('This PDF could not be opened. It may be damaged, password-protected or unavailable.'); setLoading(false);}}
    })();
    return () => {disposed = true; if (task) void task.destroy();};
  }, [doc]);
  useEffect(() => {
    if (!pdf) return;
    let disposed = false, renderTask:RenderTask|undefined;
    setLoading(true);
    (async () => {
      try {
        const pdfPage = await pdf.getPage(page); if (disposed || !canvas.current) return;
        const base = pdfPage.getViewport({scale:1}), available = Math.max(230,viewerWidth - 48);
        const scale = Math.min(available / base.width, 1.2) * zoom, viewport = pdfPage.getViewport({scale});
        const target = canvas.current, ratio = window.devicePixelRatio || 1;
        target.width = Math.floor(viewport.width * ratio); target.height = Math.floor(viewport.height * ratio);
        target.style.width = `${Math.floor(viewport.width)}px`; target.style.height = `${Math.floor(viewport.height)}px`;
        renderTask = pdfPage.render({canvas:target,viewport,transform:ratio === 1 ? undefined : [ratio,0,0,ratio,0,0]});
        await renderTask.promise; if (!disposed) setLoading(false);
      } catch (e) {if (!disposed && (e as Error).name !== 'RenderingCancelledException') {setError('This page could not be rendered. Try another page or download the sample.'); setLoading(false);}}
    })();
    return () => {disposed = true; renderTask?.cancel();};
  }, [pdf,page,zoom,viewerWidth]);
  async function find(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!pdf || !search.trim()) {setMatches([]); return;}
    setSearching(true); const found:{page:number;count:number}[] = [], term = search.toLowerCase().trim();
    try {
      for (let i=1;i<=pdf.numPages;i++) {
        const text = await (await pdf.getPage(i)).getTextContent();
        const content = text.items.map(item => 'str' in item ? item.str : '').join(' ').toLowerCase();
        const count = content.split(term).length - 1; if (count) found.push({page:i,count});
      }
      setMatches(found); setHasSearched(true); if (found.length) setPage(found[0].page);
    } catch {setError('Search was interrupted. Please try again.');} finally {setSearching(false);}
  }
  return <dialog ref={modal} className="pdf-modal" aria-labelledby="pdf-title" onCancel={onClose}>
    <div className="dialog-heading"><div><p className="eyebrow">DOCUMENT PREVIEW · SAMPLE ONLY</p><h2 id="pdf-title">{doc.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close PDF preview">×</button></div>
    <div className="pdf-toolbar"><button className="button secondary" disabled={!pdf || page === 1} onClick={()=>setPage(p=>p-1)}>Previous</button><span aria-live="polite">Page {page} of {pdf?.numPages || '…'}</span><button className="button secondary" disabled={!pdf || page === pdf.numPages} onClick={()=>setPage(p=>p+1)}>Next</button><label>Zoom<select aria-label="PDF zoom" value={zoom} onChange={e=>setZoom(Number(e.target.value))}><option value={.75}>75%</option><option value={1}>Fit width</option><option value={1.25}>125%</option><option value={1.5}>150%</option></select></label><a className="button secondary" href={downloadUrl} download={doc.file?.name || 'staff-workspace-SAMPLE.pdf'}>Download {doc.file ? 'local PDF' : 'sample PDF'}</a></div>
    <form className="pdf-find" onSubmit={find}><input aria-label="Search inside PDF" placeholder="Find text inside this PDF…" value={search} maxLength={120} disabled={searching} onChange={e=>{setSearch(e.target.value);setHasSearched(false);setMatches([]);}}/><button className="button secondary" disabled={!pdf || searching || !search.trim()}>{searching ? 'Searching…' : 'Find'}</button><span role="status">{matches.length ? `${matches.reduce((sum,m)=>sum+m.count,0)} matches on ${matches.length} ${matches.length === 1 ? 'page' : 'pages'}` : hasSearched ? 'No matches found' : search ? 'Search to find matching pages' : ''}</span></form>
    {matches.length > 0 && <div className="pdf-matches" aria-label="PDF search results">{matches.map(m=><button key={m.page} onClick={()=>setPage(m.page)}>Page {m.page} · {m.count} {m.count === 1 ? 'match' : 'matches'}</button>)}</div>}
    <div className="pdf-scroller" ref={scroller}>{error ? <p role="alert" className="error">{error}</p> : <><p role="status" className="pdf-loading">{loading ? 'Rendering PDF…' : `Page ${page} ready`}</p><canvas ref={canvas} aria-label={`PDF page ${page}`}/></>}</div><p className="pdf-footnote">Rendered locally using PDF.js. No Google or public document viewer is used. This sample is not an approved JDPI policy.</p>
  </dialog>;
}
