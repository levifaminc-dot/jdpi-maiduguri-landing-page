import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {PDFDocument,PDFName,PDFString} from 'pdf-lib';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
import {createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';
import {documentFeed,uploadDocument,changeDocument,readDocumentFile} from '../lib/documents.mjs';
import {validatePdf} from '../lib/pdf-validation.mjs';
import {validDocumentUpload,PDF_MAX_BYTES,DOCUMENT_BUDGET_BYTES} from '../lib/document-policy.mjs';
import {boundedBytes} from '../lib/private-bytes.mjs';
import {SHAREPOINT_TARGET} from '../lib/sharepoint-target.mjs';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const person=n=>({tenantId:JDPI_TENANT_ID,objectId:id(n),name:`Fictional colleague ${n}`});
const admin=person(1),staff=person(2),other=person(3),pending=person(4),suspended=person(5);
const metadata=(n=100)=>({id:id(n),title:'Fictional team resource',description:'General guidance\nFor testing only.',folder:'Templates & tools',filename:'fictional.pdf'});
const bytes=new Uint8Array(Buffer.from('%PDF-1.7\nFictional test bytes only\n%%EOF'));
const stubValidator=async()=>2;
async function fixture() {
  const db=new PGlite();
  for(const name of ['000-auth.sql','001-membership.sql','002-announcements.sql','003-documents.sql','004-document-storage.sql'])await db.exec(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'));
  await db.exec('CREATE TABLE workspace_migration(name text PRIMARY KEY)');
  for(const [identity,role,status] of [[admin,'ADMIN','ACTIVE'],[staff,'STAFF','ACTIVE'],[other,'STAFF','ACTIVE'],[pending,'STAFF','PENDING'],[suspended,'STAFF','SUSPENDED']])await db.query('INSERT INTO workspace_member(tenant_id,object_id,name,role,status) VALUES ($1,$2,$3,$4,$5)',[identity.tenantId,identity.objectId,identity.name,role,status]);
  await db.exec(createRuntimeRoleSql);await db.exec(runtimeGrantsSql((await db.query('SELECT current_database() AS name')).rows[0].name));
  await verifyRuntimeRole(db);await db.exec('SET ROLE jdpi_workspace_runtime');
  const pool={connect:async()=>({query:(sql,params)=>db.query(sql,params),release(){}})};
  const files=new Map();let writes=0,reads=0;
  const storage={put:async(path,data)=>{writes++;files.set(path,new Uint8Array(data));},read:async path=>{reads++;return files.get(path);}};
  return {db,pool,storage,files,writes:()=>writes,reads:()=>reads};
}
test('PDF parser accepts ordinary PDFs and rejects scripts, attachments, damaged files and excessive pages',async()=>{
  const make=async()=>{const pdf=await PDFDocument.create();pdf.addPage([500,700]).drawText('Fictional resource');pdf.addPage();return pdf;};
  assert.equal(await validatePdf(await (await make()).save()),2);
  const script=await make();script.catalog.set(PDFName.of('OpenAction'),script.context.obj({S:PDFName.of('JavaScript'),JS:PDFString.of('fictional()')}));
  await assert.rejects(validatePdf(await script.save()),{status:400});
  const attachment=await make();await attachment.attach(new Uint8Array([1,2]),'fictional.txt');await assert.rejects(validatePdf(await attachment.save()),{status:400});
  const tooMany=await PDFDocument.create();for(let n=0;n<201;n++)tooMany.addPage();await assert.rejects(validatePdf(await tooMany.save()),{status:400});
  await assert.rejects(validatePdf(new Uint8Array(Buffer.from('<html>Not a PDF</html>'))),{status:400});
  await assert.rejects(validatePdf(bytes),{status:400});
  await assert.rejects(validatePdf(new Uint8Array(PDF_MAX_BYTES+1)),{status:413});
  const giant=await PDFDocument.create();giant.addPage([20000,20000]);await assert.rejects(validatePdf(await giant.save()),{status:400});
});
test('all ACTIVE staff share immediately; nonmembers, wrong tenants and suspended users cannot parse, upload or read',async()=>{
  const f=await fixture();try {
    let parses=0;const validator=async()=>{parses++;return 2;};
    for(const actor of [pending,suspended,person(6),{...staff,tenantId:id(9)}]) {
      await assert.rejects(uploadDocument(f.pool,actor,metadata(),bytes,f.storage,validator));
      await assert.rejects(documentFeed(f.pool,actor));await assert.rejects(readDocumentFile(f.pool,actor,id(100),f.storage));
    }
    assert.equal(parses,0);assert.equal(f.writes(),0);assert.equal(f.reads(),0);
    const doc=await uploadDocument(f.pool,staff,metadata(),bytes,f.storage,validator);
    assert.equal(doc.status,'READY');assert.equal(doc.uploader,staff.name);assert.equal(doc.pages,2);assert.equal(doc.version,2);
    for(const key of ['sha256','blob_path','url','uploader_object_id','storage_provider','storage_site_id','storage_drive_id'])assert(!(key in doc));
    assert.equal((await documentFeed(f.pool,other)).documents.length,1);
    assert.deepEqual((await readDocumentFile(f.pool,other,id(100),f.storage)).bytes,bytes);
    await f.db.exec('RESET ROLE');await f.db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[staff.objectId]);await f.db.exec('SET ROLE jdpi_workspace_runtime');
    await assert.rejects(readDocumentFile(f.pool,staff,id(100),f.storage),{status:403});
  }finally{await f.db.close();}
});
test('duplicate submissions are idempotent, ownership cannot be forged and immutable metadata cannot be changed',async()=>{
  const f=await fixture();try {
    const first=await uploadDocument(f.pool,staff,metadata(),bytes,f.storage,stubValidator);
    assert.deepEqual(await uploadDocument(f.pool,staff,metadata(),bytes,f.storage,stubValidator),first);assert.equal(f.writes(),1);
    assert.equal(Number((await f.db.query('SELECT reserved_bytes FROM workspace_document_control')).rows[0].reserved_bytes),bytes.length);
    await assert.rejects(uploadDocument(f.pool,other,metadata(),bytes,f.storage,stubValidator),{status:409});
    await assert.rejects(uploadDocument(f.pool,staff,{...metadata(),title:'Changed title'},bytes,f.storage,stubValidator),{status:409});
    for(const value of [{...metadata(),uploader_object_id:admin.objectId},{...metadata(),status:'READY'},{...metadata(),filename:'../test.pdf'},{...metadata(),title:'bad\0title'}])assert(!validDocumentUpload(value));
    assert(validDocumentUpload(metadata()));
    await assert.rejects(f.db.query('UPDATE workspace_document SET uploader_object_id=$1',[other.objectId]));
    await assert.rejects(f.db.query('UPDATE workspace_document SET blob_path=$1',['forged-path']));
    await assert.rejects(f.db.query("UPDATE workspace_document SET storage_provider='sharepoint'"));
    await assert.rejects(f.db.query("UPDATE workspace_document SET storage_site_id='forged-site'"));
    await assert.rejects(f.db.exec('DELETE FROM workspace_document'));await assert.rejects(f.db.exec('TRUNCATE workspace_document'));
    await assert.rejects(f.db.exec('UPDATE workspace_audit SET action=\'forged\''));
  }finally{await f.db.close();}
});

test('immutable per-document routing keeps Blob files readable after switching new uploads to SharePoint',async()=>{
  const f=await fixture();try {
    await uploadDocument(f.pool,staff,metadata(),bytes,f.storage,stubValidator);
    const sharepoint={...f.storage,reference:()=>({provider:'sharepoint',siteId:SHAREPOINT_TARGET.siteId,driveId:SHAREPOINT_TARGET.driveId})};
    await uploadDocument(f.pool,staff,metadata(101),bytes,sharepoint,stubValidator);
    const seen=[];
    const resolve=row=>{seen.push(row.storage_provider);return f.storage;};
    await readDocumentFile(f.pool,other,id(100),resolve);
    await readDocumentFile(f.pool,other,id(101),resolve);
    assert.deepEqual(seen,['blob','sharepoint']);
    const row=(await f.db.query('SELECT storage_site_id,storage_drive_id FROM workspace_document WHERE id=$1',[id(101)])).rows[0];
    assert.equal(row.storage_site_id,SHAREPOINT_TARGET.siteId);assert.equal(row.storage_drive_id,SHAREPOINT_TARGET.driveId);
    await assert.rejects(uploadDocument(f.pool,other,metadata(102),bytes,{...f.storage,reference:()=>({provider:'sharepoint',siteId:'wrong',driveId:'wrong'})},stubValidator));
    assert.equal(f.writes(),2);
  }finally{await f.db.close();}
});
test('archive and restore enforce ownership, version conflicts and admin moderation',async()=>{
  const f=await fixture();try {
    await uploadDocument(f.pool,staff,metadata(),bytes,f.storage,stubValidator);
    await assert.rejects(changeDocument(f.pool,{...other,role:'ADMIN'},{action:'archive',id:id(100),version:2}),{status:403});
    await assert.rejects(changeDocument(f.pool,staff,{action:'archive',id:id(100),version:1}),{status:409});
    await changeDocument(f.pool,staff,{action:'archive',id:id(100),version:2});
    assert.equal((await documentFeed(f.pool,other)).documents.length,0);assert.equal((await documentFeed(f.pool,other,{view:'archive'})).documents.length,0);
    await assert.rejects(readDocumentFile(f.pool,other,id(100),f.storage),{status:404});await readDocumentFile(f.pool,staff,id(100),f.storage);
    await changeDocument(f.pool,staff,{action:'restore',id:id(100),version:3});
    await changeDocument(f.pool,admin,{action:'archive',id:id(100),version:4});
    assert.equal((await documentFeed(f.pool,staff,{view:'mine'})).documents[0].canManage,false);
    await assert.rejects(changeDocument(f.pool,staff,{action:'restore',id:id(100),version:5}),{status:403});
    await changeDocument(f.pool,admin,{action:'restore',id:id(100),version:5});assert.equal((await documentFeed(f.pool,other)).documents.length,1);
    assert(!(await f.db.query('SELECT details FROM workspace_audit')).rows.some(row=>JSON.stringify(row).includes('General guidance')));
  }finally{await f.db.close();}
});
test('storage failures or access revoked during upload remain unpublished; quota is reserved conservatively',async()=>{
  const f=await fixture();try {
    await assert.rejects(uploadDocument(f.pool,staff,metadata(),bytes,{put:async()=>{throw new Error('private provider message');}},stubValidator),{status:503});
    assert.equal((await documentFeed(f.pool,other)).documents.length,0);
    assert.equal((await documentFeed(f.pool,staff,{view:'mine'})).documents[0].status,'FAILED');
    const storage={put:async()=>{await f.db.exec('RESET ROLE');await f.db.query("UPDATE workspace_member SET status='SUSPENDED' WHERE object_id=$1",[staff.objectId]);await f.db.exec('SET ROLE jdpi_workspace_runtime');}};
    await assert.rejects(uploadDocument(f.pool,staff,metadata(101),bytes,storage,stubValidator),{status:403});
    assert.equal((await f.db.query('SELECT count(*)::int AS n FROM workspace_document WHERE status=\'READY\'')).rows[0].n,0);
    assert.equal(Number((await f.db.query('SELECT reserved_bytes FROM workspace_document_control')).rows[0].reserved_bytes),bytes.length*2);
  }finally{await f.db.close();}
});
test('invalid PDF attempts are throttled before parsing; quota denial never sends files to storage',async()=>{
  const f=await fixture();try {
    for(let n=100;n<103;n++)await uploadDocument(f.pool,staff,metadata(n),bytes,f.storage,stubValidator);
    let parsed=false;await assert.rejects(uploadDocument(f.pool,staff,metadata(103),bytes,f.storage,async()=>{parsed=true;return 2;}),{status:429});assert.equal(parsed,false);
    await f.db.query('UPDATE workspace_document_control SET reserved_bytes=$1 WHERE id=1',[DOCUMENT_BUDGET_BYTES]);
    await assert.rejects(uploadDocument(f.pool,other,metadata(110),bytes,f.storage,stubValidator),{status:409});assert.equal(f.writes(),3);
    await assert.rejects(documentFeed(f.pool,staff,{offset:-1}),{status:400});
    assert.equal((await documentFeed(f.pool,staff,{query:'%'})).documents.length,0);
    assert.equal((await documentFeed(f.pool,staff,{folder:'Reports'})).documents.length,0);
  }finally{await f.db.close();}
});
test('private file integrity is verified before delivery',async()=>{
  const f=await fixture();try {
    await uploadDocument(f.pool,staff,metadata(),bytes,f.storage,stubValidator);
    await assert.rejects(readDocumentFile(f.pool,staff,id(100),null),{status:503});
    await assert.rejects(readDocumentFile(f.pool,staff,id(100),{read:async()=>new Uint8Array(bytes.length)}),{status:503});
    await assert.rejects(readDocumentFile(f.pool,staff,id(999),f.storage),{status:404});
  }finally{await f.db.close();}
});
test('chunked input is bounded and routes authorize before reading; no public URLs or browser secrets',async()=>{
  assert.equal((await boundedBytes(new Response('small').body,10)).length,5);
  await assert.rejects(boundedBytes(new Response('too large').body,2),{status:413});
  const route=await readFile(new URL('../app/api/documents/route.ts',import.meta.url),'utf8');
  assert(route.indexOf('requireActiveMember(request.headers)')<route.indexOf('boundedBytes(request.body'));
  assert.match(route,/get\('origin'\)!==config.origin/);assert.match(route,/private, no-store/);
  const file=await readFile(new URL('../app/api/documents/[id]/file/route.ts',import.meta.url),'utf8');assert.match(file,/requireActiveMember/);assert.match(file,/attachment;/);assert.doesNotMatch(file,/redirect\(|\.url/);
  const component=await readFile(new URL('../components/Documents.tsx',import.meta.url),'utf8');assert.doesNotMatch(component,/dangerouslySetInnerHTML|BLOB_READ_WRITE_TOKEN|blob\.vercel-storage/);
  const storage=await readFile(new URL('../lib/private-storage.mjs',import.meta.url),'utf8');assert.match(storage,/access:'private'/);assert.doesNotMatch(storage,/access:'public'|allowOverwrite:true/);
});
