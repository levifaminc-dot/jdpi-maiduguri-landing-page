export const JDPI_TENANT_ID = '2b64e4e5-af74-4b92-baab-b3621aef964d';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function microsoftConfig(env) {
  const tenantId = env.MICROSOFT_TENANT_ID?.toLowerCase();
  const clientId = env.MICROSOFT_CLIENT_ID;
  const clientSecret = env.MICROSOFT_CLIENT_SECRET;
  const secret = env.BETTER_AUTH_SECRET;
  if (tenantId !== JDPI_TENANT_ID || !uuid.test(clientId ?? '') || !clientSecret || clientSecret.length < 20 || !secret || secret.length < 32) return null;
  try {
    const url = new URL(env.BETTER_AUTH_URL);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    const local = url.protocol === 'http:' && url.hostname === 'localhost' && url.port === '4330';
    if (!(url.protocol === 'https:' || (local && env.NODE_ENV === 'development' && !env.VERCEL))) return null;
    return {tenantId, clientId, clientSecret, secret, origin:url.origin};
  } catch {return null;}
}

// Called only AFTER the OIDC library verifies signature, issuer, audience,
// expiry and the server-generated nonce. Email is display data, never authority.
export function microsoftProfile(claims, tenantId) {
  if (tenantId !== JDPI_TENANT_ID || claims.tid !== tenantId || !uuid.test(claims.oid ?? '') || claims.iss !== `https://login.microsoftonline.com/${tenantId}/v2.0`) return null;
  const objectId = claims.oid.toLowerCase();
  return {
    oid:objectId, tenantId, objectId,
    email:`${objectId}@microsoft-identity.invalid`, emailVerified:false,
    name:typeof claims.name === 'string' ? claims.name.slice(0, 150) : 'JDPI colleague',
  };
}

export function verifiedIdentity(user) {
  return !!user && user.tenantId === JDPI_TENANT_ID && uuid.test(user.objectId ?? '');
}

export function allowedAuthRequest(method, path) {
  return (method === 'POST' && ['/sign-in/social', '/sign-out'].includes(path)) ||
    (method === 'GET' && ['/get-session', '/callback/microsoft', '/error'].includes(path));
}

export function validSignInBody(body) {
  return !!body && typeof body === 'object' && !Array.isArray(body) &&
    Object.keys(body).every(key => ['provider', 'callbackURL', 'errorCallbackURL'].includes(key)) &&
    body.provider === 'microsoft' && body.callbackURL === '/workspace' && body.errorCallbackURL === '/auth/error';
}

export function redactedAuthDiagnostic(values) {
  for (const value of values) {
    if (!value || typeof value !== 'object') continue;
    const codes = value.error_codes ?? value.data?.error_codes;
    if (Array.isArray(codes)) {
      const safe = codes.filter(code => Number.isInteger(code) && code > 0 && code < 100000000).slice(0,3);
      if (safe.length) return safe.map(code => `AADSTS${code}`).join(',');
    }
  }
  return 'authentication_failed';
}
