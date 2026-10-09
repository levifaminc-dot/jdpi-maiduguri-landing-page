import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createMicrosoftAuth} from '../lib/auth.ts';
import {JDPI_TENANT_ID} from '../lib/microsoft-policy.mjs';
test('PostgreSQL adapter persists sessions, strips provider tokens, ignores old cookie cache, and observes revocation',async()=>{
  const db=new PGlite();
  await db.exec(await readFile(new URL('../database/000-auth.sql',import.meta.url),'utf8'));
  const client={release(){},query:async(sql,params)=>{
    const result=await db.query(sql,params);
    // pg returns JS Dates for timestamp columns; emulate that in local transport.
    for(const row of result.rows) for(const key of Object.keys(row)) if((key.endsWith('At')||key==='expires_at') && typeof row[key]==='string') row[key]=new Date(row[key]);
    return {...result,command:sql.trim().split(/\s/)[0].toUpperCase(),rowCount:result.affectedRows ?? result.rows.length};
  }};
  const pool={connect:async()=>client,end:async()=>{},query:client.query};
  const tenantId=JDPI_TENANT_ID,clientId='00000000-0000-4000-8000-000000000002',origin='http://localhost:4330';
  const issuer=`https://login.microsoftonline.com/${tenantId}/v2.0`,authority=`https://login.microsoftonline.com/${tenantId}`;
  const keys=await generateKeyPair('RS256'),jwk={...await exportJWK(keys.publicKey),kid:'fictional-durable',alg:'RS256',use:'sig'};
  let nonce;const originalFetch=globalThis.fetch;
  globalThis.fetch=async input=>{
    const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
    if(url===`${issuer}/.well-known/openid-configuration`) return Response.json({issuer,authorization_endpoint:`${authority}/oauth2/v2.0/authorize`,token_endpoint:`${authority}/oauth2/v2.0/token`,jwks_uri:`${authority}/discovery/v2.0/keys`,id_token_signing_alg_values_supported:['RS256']});
    if(url===`${authority}/discovery/v2.0/keys`) return Response.json({keys:[jwk]});
    if(url===`${authority}/oauth2/v2.0/token`) return Response.json({access_token:'fictional-access-token',token_type:'Bearer',expires_in:300,id_token:await new SignJWT({tid:tenantId,oid:'00000000-0000-4000-8000-000000000003',name:'Fictional staff',nonce}).setProtectedHeader({alg:'RS256',kid:'fictional-durable'}).setIssuer(issuer).setAudience(clientId).setSubject('fictional-subject').setIssuedAt().setExpirationTime('5m').sign(keys.privateKey)});
    throw new Error('Unexpected external request in isolated test');
  };
  const cookies=response=>response.headers.getSetCookie().filter(v=>!v.includes('Max-Age=0')).map(v=>v.split(';')[0]).join('; ');
  try {
    const auth=createMicrosoftAuth({tenantId,clientId,clientSecret:'fictional-secret-only',secret:'fictional-app-secret-'.repeat(4),origin},pool);
    const start=await auth.handler(new Request(`${origin}/api/auth/sign-in/social`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({provider:'microsoft',callbackURL:'/workspace',errorCallbackURL:'/auth/error'})}));
    assert.equal(start.status,200);
    const authorize=new URL((await start.json()).url);nonce=authorize.searchParams.get('nonce');
    const success=await auth.handler(new Request(`${origin}/api/auth/callback/microsoft?code=fictional-code&state=${authorize.searchParams.get('state')}`,{headers:{cookie:cookies(start)}}));
    assert(success.headers.get('location')?.endsWith('/workspace'),'verified callback must succeed');
    const cookie=cookies(success);assert(!cookie.includes('session_data='),'durable mode must not cache authorisation');
    const stored=(await db.query('SELECT "accessToken","refreshToken","idToken" FROM account')).rows[0];
    assert.deepEqual(stored,{accessToken:null,refreshToken:null,idToken:null});
    const session=await auth.api.getSession({headers:new Headers({cookie}),query:{disableCookieCache:true}});
    assert.equal(session.user.objectId,'00000000-0000-4000-8000-000000000003');
    // A fresh auth instance still retrieves the same persisted database session.
    const restarted=createMicrosoftAuth({tenantId,clientId,clientSecret:'fictional-secret-only',secret:'fictional-app-secret-'.repeat(4),origin},pool);
    assert((await restarted.api.getSession({headers:new Headers({cookie}),query:{disableCookieCache:true}}))?.user);
    await db.query('DELETE FROM "session"');
    assert.equal(await auth.api.getSession({headers:new Headers({cookie}),query:{disableCookieCache:true}}),null);
  }finally{globalThis.fetch=originalFetch;await db.close();}
});
