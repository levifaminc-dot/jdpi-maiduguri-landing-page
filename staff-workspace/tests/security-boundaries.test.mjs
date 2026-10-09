import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {boundedJson} from '../lib/private-json.mjs';
import {boundedAuthRequest} from '../lib/auth-request.mjs';
import config from '../next.config.mjs';
test('chunked JSON limits count UTF-8 bytes and cancel oversized input',async()=>{
  let cancelled=false;
  const request=new Request('https://staff.example.invalid',{method:'POST',duplex:'half',headers:{'content-type':'application/json'},body:new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"value":"'));c.enqueue(new TextEncoder().encode('é'.repeat(1500)));},cancel(){cancelled=true;}})});
  await assert.rejects(boundedJson(request,2048),{status:413});assert.equal(cancelled,true);
  assert.deepEqual(await boundedJson(new Request('https://staff.example.invalid',{method:'POST',body:'{}'}),2048),{});
  await assert.rejects(boundedJson(new Request('https://staff.example.invalid',{method:'POST',body:'not json'}),2048),{status:400});
});
test('authentication and membership read bounded streams, not unbounded text/clones',async()=>{
  for(const file of ['lib/auth-request.mjs','app/api/membership/route.ts']){
    const source=await readFile(new URL(`../${file}`,import.meta.url),'utf8');
    assert.match(source,/boundedJson\(request,2048\)/);assert.doesNotMatch(source,/request\.clone\(|request\.text\(/);
  }
});
test('the auth boundary preserves cookies and allowed login data but refuses extra fields and oversized sign-out',async()=>{
  const body={provider:'microsoft',callbackURL:'/workspace',errorCallbackURL:'/auth/error'};
  const input=value=>new Request('https://staff.example.invalid/api/auth/sign-in/social',{method:'POST',headers:{origin:'https://staff.example.invalid',cookie:'fixture=not-a-credential','content-type':'application/json','content-length':'1'},body:JSON.stringify(value)});
  const rebuilt=await boundedAuthRequest(input(body),'/sign-in/social');
  assert.deepEqual(await rebuilt.json(),body);assert.equal(rebuilt.headers.get('cookie'),'fixture=not-a-credential');assert.equal(rebuilt.headers.get('origin'),'https://staff.example.invalid');assert.equal(rebuilt.headers.get('content-length'),null);
  await assert.rejects(boundedAuthRequest(input({...body,role:'ADMIN'}),'/sign-in/social'),{status:400});
  await assert.rejects(boundedAuthRequest(input({}),'/unapproved'),{status:400});
  await assert.rejects(boundedAuthRequest(input({text:'x'.repeat(3000)}),'/sign-out'),{status:413});
  assert.deepEqual(await (await boundedAuthRequest(input({}),'/sign-out')).json(),{});
  const route=await readFile(new URL('../app/api/auth/[...all]/route.ts',import.meta.url),'utf8');assert.match(route,/await boundedAuthRequest\(request,path\)/);
});
test('all staff responses restrict browser capabilities; API responses prohibit execution',async()=>{
  const rules=await config.headers();
  assert(rules[0].headers.some(h=>h.key==='Permissions-Policy' && h.value.includes('camera=()')));
  const api=rules.find(rule=>rule.source==='/api/:path*');
  assert.match(api.headers.find(h=>h.key==='Content-Security-Policy').value,/default-src 'none'/);
  const viewer=await readFile(new URL('../components/PdfViewer.tsx',import.meta.url),'utf8');assert.match(viewer,/enableXfa:false/);
});
