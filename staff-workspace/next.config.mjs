import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
export default {
  poweredByHeader: false,
  // Preserve the absolute localhost auth redirect. Default normalization treats
  // 127.0.0.1 and localhost as equivalent, creating a relative redirect loop.
  skipProxyUrlNormalize: true,
  // OAuth callback query strings include short-lived credentials; don't log URLs.
  logging:{incomingRequests:false},
  outputFileTracingRoot: path.resolve(root, '..'),
  outputFileTracingIncludes:{'/api/documents':['./lib/pdf-validation-worker.mjs','./node_modules/pdf-lib/package.json','./node_modules/pdf-lib/cjs/**/*','./node_modules/@pdf-lib/**/*','./node_modules/pako/**/*','./node_modules/tslib/**/*']},
  turbopack: {root: path.resolve(root, '..')},
  async headers() {
    return [{source: '/:path*', headers: [
      {key: 'X-Robots-Tag', value: 'noindex, nofollow'},
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'X-Frame-Options', value: 'DENY'},
      {key: 'Referrer-Policy', value: 'no-referrer'},
      {key: 'Cache-Control', value: 'private, no-store'},
    ]}];
  },
};
