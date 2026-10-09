// Loopback-only production-output QA with the same Vercel security headers.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const editor=process.argv.includes('--studio');
const root=path.resolve(editor?'studio/dist':'dist');
const port=editor?4332:4322;
const config=JSON.parse(await readFile(editor?'studio/vercel.json':'vercel.json','utf8'));
const headers=Object.fromEntries(config.headers[0].headers.map(h=>[h.key,h.value]));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.avif':'image/avif','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'};
createServer(async(req,res)=>{
  if(!/^(127\.0\.0\.1|localhost):(?:4322|4332)$/.test(req.headers.host||'') || !['GET','HEAD'].includes(req.method)){res.writeHead(403).end();return;}
  try{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=path.resolve(root,`.${requested}`);
    if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{if(editor)file=path.join(root,'index.html');}
    const bytes=await readFile(file);res.writeHead(200,{...headers,'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404,{...headers}).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Security QA: http://127.0.0.1:${port}/`));
