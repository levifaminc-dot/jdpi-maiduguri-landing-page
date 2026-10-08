import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

// Deliberately local-only. This prototype is not part of Astro's public build.
const routes = new Map([
  ['/', ['../staff-preview/index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['../staff-preview/styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['../staff-preview/app.js', 'text/javascript; charset=utf-8']],
  ['/logo.avif', ['../public/assets/logo.avif', 'image/avif']],
  ['/samples/field-visit-checklist.txt', ['../staff-preview/samples/field-visit-checklist.txt', 'text/plain; charset=utf-8', 'field-visit-checklist-SAMPLE.txt']],
  ['/samples/staff-welcome-guide.txt', ['../staff-preview/samples/staff-welcome-guide.txt', 'text/plain; charset=utf-8', 'staff-welcome-guide-SAMPLE.txt']],
  ['/samples/programme-learning-notes.txt', ['../staff-preview/samples/programme-learning-notes.txt', 'text/plain; charset=utf-8', 'programme-learning-notes-SAMPLE.txt']],
]);
export function makePreviewServer() {
  return createServer(async (req, res) => {
    const host = req.headers.host;
    if (!host || !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) {
      res.writeHead(403).end('Local preview only'); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, {Allow: 'GET, HEAD'}).end(); return;
    }
    const route = routes.get(new URL(req.url, 'http://127.0.0.1').pathname);
    if (!route) { res.writeHead(404).end('Not found'); return; }
    try {
      const body = await readFile(new URL(route[0], import.meta.url));
      res.writeHead(200, {
        'Content-Type': route[1], 'Cache-Control': 'no-store',
        ...(route[2] ? {'Content-Disposition': `attachment; filename="${route[2]}"`} : {}),
        'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(500).end('Preview unavailable'); }
  });
}
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  const server = makePreviewServer();
  server.on('error', error => { console.error(`Cannot start staff preview: ${error.message}`); process.exitCode = 1; });
  server.listen(4330, '127.0.0.1', () => console.log('JDPI staff preview: http://127.0.0.1:4330/ (sample data only)'));
}
