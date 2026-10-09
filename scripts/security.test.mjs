import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {editorialUrl} from '../src/lib/editorial-url.ts';
import {typeid,TypeID} from 'typeid-js';
test('the CLI identifier dependency still generates and round-trips UUIDs after the security override',()=>{
  const id=typeid('test');assert.equal(TypeID.fromString(id.toString()).toUUID(),id.toUUID());assert.equal(TypeID.fromUUID('test',id.toUUID()).toString(),id.toString());assert.equal(id.toUUIDBytes().length,16);
});
test('CMS links refuse executable schemes, control characters and disguised external paths',()=>{
  for(const url of ['javascript:alert(1)','java\nscript:alert(1)','data:text/html,test','http://example.org','//evil.example','/\\evil.example','https://user:password@example.org','mailto:hello@example.org%0d%0aBcc:evil@example.org','https://example.org:8443/'])assert.equal(editorialUrl(url),undefined,url);
  for(const url of ['/about/','#story','https://example.org/story','mailto:info@jdpimaiduguri.org'])assert.equal(editorialUrl(url),url);
});
test('Portable Text uses a render-time URL guard independent of Studio validation',async()=>{
  for(const path of ['../src/components/DetailPage.astro','../src/pages/programmes/index.astro']){
    const source=await readFile(new URL(path,import.meta.url),'utf8');assert.match(source,/mark:\{link:EditorialLink\}/);
  }
});
test('website and editor deny framing and content sniffing without blocking the contact gateway',async()=>{
  for(const path of ['../vercel.json','../studio/vercel.json']){
    const config=JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
    const headers=config.headers[0].headers;
    assert.equal(headers.find(h=>h.key==='X-Frame-Options').value,'DENY');
    assert.equal(headers.find(h=>h.key==='X-Content-Type-Options').value,'nosniff');
    const csp=headers.find(h=>h.key==='Content-Security-Policy').value;
    assert.match(csp,/frame-ancestors 'none'/);assert.doesNotMatch(csp,/unsafe-eval/);
    if(path==='../vercel.json')assert.match(csp,/form-action 'self' https:\/\/formsubmit.co/);
  }
});
