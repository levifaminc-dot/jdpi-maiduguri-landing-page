import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, exportJWK, SignJWT} from 'jose';
import {createMicrosoftAuth} from '../lib/auth.ts';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';

test('OIDC redirect flow verifies tokens, preserves identity, rejects replay/tampering and signs out', async () => {
  const tenantId = JDPI_TENANT_ID;
  const clientId = '00000000-0000-4000-8000-000000000002';
  const origin = 'http://localhost:4330';
  const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
  const authority = `https://login.microsoftonline.com/${tenantId}`;
  const keys = await generateKeyPair('RS256');
  const jwk = {...await exportJWK(keys.publicKey),kid:'test-only',alg:'RS256',use:'sig'};
  let nonce = '', mode = 'valid', tokenCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === `${issuer}/.well-known/openid-configuration`) return Response.json({issuer,authorization_endpoint:`${authority}/oauth2/v2.0/authorize`,token_endpoint:`${authority}/oauth2/v2.0/token`,jwks_uri:`${authority}/discovery/v2.0/keys`,id_token_signing_alg_values_supported:['RS256']});
    if (url === `${authority}/discovery/v2.0/keys`) return Response.json({keys:[jwk]});
    if (url === `${authority}/oauth2/v2.0/token`) {
      tokenCalls++;
      const oid = '00000000-0000-4000-8000-000000000003';
      let jwt = new SignJWT({tid:mode === 'wrong-tenant' ? clientId : tenantId,oid,name:'Fictional test colleague',nonce:mode === 'wrong-nonce' ? 'replayed' : nonce});
      jwt = jwt.setProtectedHeader({alg:'RS256',kid:'test-only'}).setIssuer(mode === 'wrong-issuer' ? 'https://invalid.example' : issuer).setAudience(mode === 'wrong-audience' ? 'invalid-client' : clientId).setSubject('test-subject').setIssuedAt().setExpirationTime(mode === 'expired' ? Math.floor(Date.now()/1000)-600 : '5m');
      const idToken = await jwt.sign(keys.privateKey);
      return Response.json({access_token:'fictional-only',token_type:'Bearer',expires_in:300,id_token:mode === 'invalid-signature' ? idToken.slice(0,-20)+'a'.repeat(20) : idToken});
    }
    throw new Error('Unexpected external request in isolated auth test');
  };
  try {
    const auth = createMicrosoftAuth({tenantId,clientId,clientSecret:'test-placeholder-not-a-credential',secret:'test-secret-placeholder-'.repeat(4),origin});
    const cookies = response => response.headers.getSetCookie().filter(value => !value.includes('Max-Age=0')).map(value => value.split(';')[0]).join('; ');
    async function begin() {
      const result = await auth.handler(new Request(`${origin}/api/auth/sign-in/social`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({provider:'microsoft',callbackURL:'/workspace',errorCallbackURL:'/auth/error'})}));
      assert.equal(result.status,200);
      const authorize = new URL((await result.json()).url);
      assert.equal(authorize.origin,'https://login.microsoftonline.com');
      assert.equal(authorize.searchParams.get('redirect_uri'),`${origin}/api/auth/callback/microsoft`);
      assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');
      assert.deepEqual(authorize.searchParams.get('scope').split(' ').sort(),['email','openid','profile']);
      nonce = authorize.searchParams.get('nonce');
      assert.ok(nonce?.length >= 32);
      return {state:authorize.searchParams.get('state'),cookie:cookies(result)};
    }
    const login = await begin();
    const callback = `${origin}/api/auth/callback/microsoft?code=fictional-code&state=${encodeURIComponent(login.state)}`;
    const success = await auth.handler(new Request(callback,{headers:{cookie:login.cookie}}));
    assert.equal(success.status,302);
    assert.ok(success.headers.get('location').endsWith('/workspace'), new URL(success.headers.get('location'),origin).searchParams.get('error') ?? 'unexpected callback destination');
    const sessionCookie = cookies(success);
    assert.ok(sessionCookie.includes('session_data='));
    assert.ok(!sessionCookie.includes('account_data='));
    const getSession = cookie => auth.handler(new Request(`${origin}/api/auth/get-session`,{headers:{cookie}}));
    const session = await (await getSession(sessionCookie)).json();
    assert.equal(session.user.tenantId,tenantId);
    assert.equal(session.user.objectId,'00000000-0000-4000-8000-000000000003');
    assert.equal(session.user.role,undefined);
    const count = tokenCalls;
    const replay = await auth.handler(new Request(callback));
    assert.ok(replay.headers.get('location').includes('auth/error'));
    assert.equal(tokenCalls,count);
    for (mode of ['wrong-nonce','wrong-audience','wrong-issuer','wrong-tenant','expired','invalid-signature']) {
      const start = await begin();
      const rejection = await auth.handler(new Request(`${origin}/api/auth/callback/microsoft?code=fictional-code&state=${encodeURIComponent(start.state)}`,{headers:{cookie:start.cookie}}));
      assert.ok(rejection.headers.get('location').includes('auth/error'),mode);
      assert.ok(!cookies(rejection).includes('session_data='),mode);
    }
    const forged = sessionCookie.replace(/session_data=([^;]+)/, 'session_data=invalid').replace(/session_token=([^;]+)/, 'session_token=invalid');
    assert.ok((await (await getSession(forged)).json()) === null,'forged session cookies must not authenticate');
    const logout = await auth.handler(new Request(`${origin}/api/auth/sign-out`,{method:'POST',headers:{origin,cookie:sessionCookie,'content-type':'application/json'},body:'{}'}));
    assert.equal(logout.status,200);
    assert.ok(logout.headers.getSetCookie().some(value => value.includes('session_data=;')));
  } finally {globalThis.fetch = originalFetch;}
});
