import assert from 'node:assert/strict';
import {once} from 'node:events';
import {request} from 'node:http';
import {makePreviewServer} from './preview-staff.mjs';

const server = makePreviewServer();
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const port = server.address().port;
function get(path, method = 'GET', host = `127.0.0.1:${port}`) {
  return new Promise((resolve, reject) => {
    const req = request({hostname:'127.0.0.1',port,path,method,headers:{Host:host}}, res => {
      let body = ''; res.on('data', chunk => {body += chunk;});
      res.on('end', () => resolve({status:res.statusCode,headers:res.headers,body}));
    }); req.on('error', reject); req.end();
  });
}
try {
  for (const [path, type] of [['/','text/html'],['/styles.css','text/css'],['/app.js','text/javascript'],['/logo.avif','image/avif']]) {
    const res = await get(path); assert.equal(res.status, 200); assert.ok(res.headers['content-type'].startsWith(type));
    assert.equal(res.headers['cache-control'], 'no-store'); assert.equal(res.headers['x-robots-tag'], 'noindex, nofollow');
    assert.ok(res.headers['content-security-policy'].includes("connect-src 'none'"));
  }
  for (const path of ['/.env','/package.json','/../.env','/%2e%2e/.env','/sample-document.txt','/public/assets/team/','/anything']) assert.equal((await get(path)).status, 404, path);
  assert.equal((await get('/', 'POST')).status, 405);
  const download = await get('/samples/field-visit-checklist.txt');
  assert.equal(download.status,200); assert.ok(download.headers['content-disposition'].startsWith('attachment;'));
  assert.ok(download.body.includes('NOT AN APPROVED JDPI DOCUMENT'));
  assert.equal((await get('/', 'GET', 'attacker.invalid')).status, 403);
  const head = await get('/', 'HEAD'); assert.equal(head.status,200); assert.equal(head.body,'');
  const js = (await get('/app.js')).body;
  assert.ok(!/localStorage|sessionStorage|\bfetch\s*\(|XMLHttpRequest/.test(js));
  assert.ok(js.includes('structuredClone(initialPosts)')); assert.ok(js.includes('example.invalid'));
  console.log('Staff preview checks passed: loopback, allowlist, blocked writes, no external connections, memory-only state.');
} finally {server.close(); await once(server, 'close');}
