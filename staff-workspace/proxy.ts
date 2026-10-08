import {NextRequest, NextResponse} from 'next/server';
import {microsoftConfig} from './lib/microsoft-policy.mjs';
export function proxy(request:NextRequest) {
  const auth = microsoftConfig(process.env);
  if (auth && ['/', '/workspace', '/auth/error'].includes(request.nextUrl.pathname) && request.headers.get('host') !== new URL(auth.origin).host) return NextResponse.redirect(new URL(request.nextUrl.pathname, auth.origin));
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({request:{headers:requestHeaders}});
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
export const config = {matcher:'/((?!api|_next/static|_next/image|favicon.ico|pdf.worker|pdf-standard-fonts).*)'};
