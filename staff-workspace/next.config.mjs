import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
export default {
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(root, '..'),
  turbopack: {root: path.resolve(root, '..')},
  async headers() {
    return [{source: '/:path*', headers: [
      {key: 'X-Robots-Tag', value: 'noindex, nofollow'},
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'X-Frame-Options', value: 'DENY'},
      {key: 'Referrer-Policy', value: 'no-referrer'},
      {key: 'Cache-Control', value: 'private, no-store'},
      {key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`},
    ]}];
  },
};
