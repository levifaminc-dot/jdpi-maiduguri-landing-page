import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JDPI_TENANT_ID, microsoftConfig, microsoftProfile, verifiedIdentity, allowedAuthRequest, validSignInBody, redactedAuthDiagnostic} from '../lib/microsoft-policy.mjs';
const objectId = '00000000-0000-4000-8000-000000000001';
const env = {NODE_ENV:'development', MICROSOFT_TENANT_ID:JDPI_TENANT_ID, MICROSOFT_CLIENT_ID:objectId, MICROSOFT_CLIENT_SECRET:'x'.repeat(40), BETTER_AUTH_SECRET:'y'.repeat(64), BETTER_AUTH_URL:'http://localhost:4330'};
test('auth diagnostics emit only numeric Microsoft error codes, never credentials', () => {
  assert.equal(redactedAuthDiagnostic([{error_codes:[7000215],error_description:'credential-shaped-private-value'}]),'AADSTS7000215');
  assert.equal(redactedAuthDiagnostic([{error_codes:['secret',-1],message:'private-value'}]),'authentication_failed');
});
test('configuration fails closed, including wrong tenant and insecure production', () => {
  assert.equal(microsoftConfig({}),null);
  assert.equal(microsoftConfig({...env, MICROSOFT_TENANT_ID:'common'}),null);
  assert.equal(microsoftConfig({...env, MICROSOFT_CLIENT_SECRET:''}),null);
  assert.equal(microsoftConfig({...env, NODE_ENV:'production'}),null);
  assert.equal(microsoftConfig({...env, VERCEL:'1'}),null);
  assert.equal(microsoftConfig({...env, BETTER_AUTH_URL:'http://evil.example/'}),null);
  assert.equal(microsoftConfig({...env, BETTER_AUTH_URL:'https://a.example/?return=evil'}),null);
  assert.equal(microsoftConfig(env).origin,'http://localhost:4330');
});
test('verified profile requires immutable object identity and exact issuer/tenant', () => {
  const claims = {tid:JDPI_TENANT_ID, oid:objectId, iss:`https://login.microsoftonline.com/${JDPI_TENANT_ID}/v2.0`, name:'Sample colleague', email:'tayo@jdpimaiduguri.org', roles:['Admin']};
  const profile = microsoftProfile(claims,JDPI_TENANT_ID);
  assert.equal(profile.objectId,objectId);
  assert.equal(profile.roles,undefined);
  assert.equal(profile.emailVerified,false);
  assert.notEqual(profile.email,claims.email);
  assert.equal(microsoftProfile({...claims, tid:objectId},JDPI_TENANT_ID),null);
  assert.equal(microsoftProfile({...claims, oid:''},JDPI_TENANT_ID),null);
  assert.equal(microsoftProfile({...claims, iss:'https://evil.example'},JDPI_TENANT_ID),null);
  assert.equal(verifiedIdentity({email:claims.email, role:'Admin'}),false);
  assert.equal(verifiedIdentity(profile),true);
});
test('only redirect-based Microsoft login and local logout are exposed', () => {
  assert.equal(allowedAuthRequest('POST','/sign-in/social'),true);
  assert.equal(allowedAuthRequest('GET','/callback/microsoft'),true);
  for (const path of ['/sign-up/email','/update-user','/link-social','/get-access-token','/callback/google','/admin/create-user']) assert.equal(allowedAuthRequest('POST',path),false);
  assert.equal(allowedAuthRequest('GET','/sign-out'),false);
  const body = {provider:'microsoft', callbackURL:'/workspace', errorCallbackURL:'/auth/error'};
  assert.equal(validSignInBody(body),true);
  for (const field of ['idToken','scopes','additionalParams','role','tenantId']) assert.equal(validSignInBody({...body,[field]:'untrusted'}),false);
  assert.equal(validSignInBody({...body, callbackURL:'https://evil.example'}),false);
});
