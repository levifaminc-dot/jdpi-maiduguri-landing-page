export const PDF_MAX_BYTES=3*1024*1024;
export const DOCUMENT_BUDGET_BYTES=800*1024*1024;
export const documentFolders=['Policies & guidance','Templates & tools','Programme resources','Reports','Other'];
export const documentId=value=>typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const text=(v,max,required=true,multiline=false)=>typeof v==='string' && v.length<=max && (!required || v.trim().length>0) && !(multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/:/[\u0000-\u001f\u007f]/).test(v);
export function validDocumentUpload(value) {
  return value && Object.keys(value).every(key=>['id','title','description','folder','filename'].includes(key)) && documentId(value.id) && text(value.title,160) && text(value.description,1000,false,true) && documentFolders.includes(value.folder) && text(value.filename,160) && /\.pdf$/i.test(value.filename) && !/[\\/]/.test(value.filename);
}
export function validDocumentAction(value) {
  return value && Object.keys(value).every(key=>['action','id','version'].includes(key)) && ['archive','restore'].includes(value.action) && documentId(value.id) && Number.isSafeInteger(value.version) && value.version>0 && value.version<2147483647;
}
export const documentPath=(tenant,id)=>`staff-pdfs/${tenant}/${id}.pdf`;
