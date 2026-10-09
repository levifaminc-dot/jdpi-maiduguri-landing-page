import test from 'node:test';
import assert from 'node:assert/strict';
import {sharepointStorage} from '../lib/sharepoint-storage.mjs';
import {SHAREPOINT_TARGET as target} from '../lib/sharepoint-target.mjs';
import {PDF_MAX_BYTES} from '../lib/document-policy.mjs';
const env={MICROSOFT_TENANT_ID:target.tenantId,MICROSOFT_CLIENT_ID:target.clientId,MICROSOFT_CLIENT_SECRET:'fictional-secret-never-used-for-network'};
const id='00000000-0000-4000-8000-000000000100';
const path=`staff-pdfs/${target.tenantId}/${id}.pdf`;
const bytes=new Uint8Array(Buffer.from('%PDF-1.7\nFictional fixture\n%%EOF'));
const json=(body,status=200)=>Response.json(body,{status});
const token=()=>json({access_token:'fictional-token',token_type:'Bearer',expires_in:3600});
const uploadUrl=`https://${target.hostname}/_api/v2.0/drive/upload?fictional=fixture-only`;
const session=()=>json({uploadUrl,expirationDateTime:new Date(Date.now()+3600000).toISOString()});
const item=()=>json({id:'fictional-item',name:`${id}.pdf`,size:bytes.length,file:{mimeType:'application/pdf'},parentReference:{driveId:target.driveId}},201);

test('SharePoint configuration is bound to the approved tenant and app; reference/path forgery never makes a request',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw new Error('should not fetch');};
  for(const settings of [{},{...env,MICROSOFT_TENANT_ID:'wrong'},{...env,MICROSOFT_CLIENT_ID:'wrong'},{...env,MICROSOFT_CLIENT_SECRET:'short'}])assert.equal(sharepointStorage(settings,fetcher),null);
  const storage=sharepointStorage(env,fetcher);
  for(const value of ['../private.pdf',`${path}/more`,path.replace(target.tenantId,'wrong'),'https://other.invalid/document.pdf'])await assert.rejects(storage.read(value));
  await assert.rejects(storage.put(path,bytes,{...storage.reference(),driveId:'another-drive'}));
  await assert.rejects(storage.read(path,{...storage.reference(),siteId:'another-site'}));
  await assert.rejects(storage.put(path,new Uint8Array(PDF_MAX_BYTES+1)));
  assert.equal(calls,0);
});

test('upload uses fail-on-conflict and signed server-side transfer without forwarding the bearer token',async()=>{
  const calls=[];const replies=[token(),session(),item()];
  const storage=sharepointStorage(env,async(url,options)=>{calls.push({url,options});return replies.shift();});
  await storage.put(path,bytes);
  assert.equal(calls.length,3);
  assert.equal(new URL(calls[0].url).hostname,'login.microsoftonline.com');
  assert.equal(calls[0].options.body.get('scope'),'https://graph.microsoft.com/.default');
  const create=calls[1];assert.equal(new URL(create.url).hostname,'graph.microsoft.com');
  assert.equal(create.options.method,'POST');assert.equal(JSON.parse(create.options.body).item['@microsoft.graph.conflictBehavior'],'fail');
  assert.equal(create.options.headers.Authorization,'Bearer fictional-token');
  assert.equal(calls[2].url,uploadUrl);assert.equal(calls[2].options.headers.Authorization,undefined);
  assert.equal(calls[2].options.redirect,'error');assert.equal(calls[2].options.headers['Content-Range'],`bytes 0-${bytes.length-1}/${bytes.length}`);
});

test('conflict, throttling and uncertain commit responses never overwrite, retry or delete files',async()=>{
  for(const status of [409,429,500]) {
    let calls=0;
    const storage=sharepointStorage(env,async()=>{calls++;return calls===1?token():json({error:'provider-private-detail'},status);});
    await assert.rejects(storage.put(path,bytes),error=>!error.message.includes('provider-private-detail'));
    assert.equal(calls,2);
  }
  let calls=0;const replies=[token(),session(),json({error:'private-commit-detail'},500)];
  const storage=sharepointStorage(env,async(_url,options)=>{calls++;assert.notEqual(options.method,'DELETE');return replies.shift();});
  await assert.rejects(storage.put(path,bytes));assert.equal(calls,3);
});

test('signed transfer URLs reject foreign hosts, credentials, ports, HTTP and additional redirects',async()=>{
  for(const url of ['https://attacker.invalid/file','https://jdpcmaiduguri.sharepoint.com.attacker.invalid/file','http://jdpcmaiduguri.sharepoint.com/file','https://name:password@jdpcmaiduguri.sharepoint.com/file','https://jdpcmaiduguri.sharepoint.com:444/file','https://jdpcmaiduguri.sharepoint.com/file#fragment']) {
    let calls=0;const storage=sharepointStorage(env,async()=>{calls++;return calls===1?token():json({uploadUrl:url,expirationDateTime:new Date(Date.now()+3600000).toISOString()});});
    await assert.rejects(storage.put(path,bytes));assert.equal(calls,2);
  }
  let calls=0;const replies=[token(),new Response(null,{status:302,headers:{location:'https://attacker.invalid/file'}})];
  await assert.rejects(sharepointStorage(env,async()=>{calls++;return replies.shift();}).read(path));assert.equal(calls,2);
});

test('private downloads keep signed URLs server-side, never forward credentials and enforce the size bound',async()=>{
  const calls=[];const replies=[token(),new Response(null,{status:302,headers:{location:uploadUrl}}),new Response(bytes)];
  const storage=sharepointStorage(env,async(url,options)=>{calls.push({url,options});return replies.shift();});
  assert.deepEqual(await storage.read(path),bytes);
  assert.equal(calls[1].options.redirect,'manual');assert.equal(calls[2].options.redirect,'error');assert.equal(calls[2].options.headers,undefined);
  const oversized=[token(),new Response('x',{headers:{'content-length':String(PDF_MAX_BYTES+1)}})];
  await assert.rejects(sharepointStorage(env,async()=>oversized.shift()).read(path));
  const chunked=[token(),new Response(new Uint8Array(PDF_MAX_BYTES+1))];
  await assert.rejects(sharepointStorage(env,async()=>chunked.shift()).read(path),{status:413});
});

test('token caching coalesces concurrent authentication and read-only verification checks the exact site and library',async()=>{
  let tokens=0,clock=Date.now();
  const storage=sharepointStorage(env,async(url)=>{
    if(url.includes('/oauth2/')){tokens++;return token();}
    if(url.includes('/sites/'))return json({id:target.siteId,webUrl:`https://${target.hostname}/sites/JDPIStaffDocuments`});
    return json({id:target.driveId,driveType:'documentLibrary',webUrl:`https://${target.hostname}/sites/JDPIStaffDocuments/Shared%20Documents`});
  },()=>clock);
  assert.deepEqual(await Promise.all([storage.verify(),storage.verify()]),[true,true]);assert.equal(tokens,1);
  clock+=3600000;await storage.verify();assert.equal(tokens,2);
  const wrong=sharepointStorage(env,async url=>url.includes('/oauth2/')?token():json({id:'wrong',webUrl:'https://attacker.invalid/'}));
  await assert.rejects(wrong.verify());
});
