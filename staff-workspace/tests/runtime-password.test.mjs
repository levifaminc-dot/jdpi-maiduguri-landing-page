import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {runtimePasswordProblem,runtimePasswordVerifier,runtimeConnectionUrl} from '../lib/runtime-password.mjs';

const fictional='Fictional-test-only-password-123!';
test('password feedback identifies the requirement without revealing input',()=>{
  assert.match(runtimePasswordProblem('private-short-value'),/at least 24/);
  assert.match(runtimePasswordProblem('x'.repeat(129)),/no more than 128/);
  assert.match(runtimePasswordProblem(`${fictional} `),/without spaces/);
  assert.match(runtimePasswordProblem(`${fictional}é`),/accents/);
  assert.equal(runtimePasswordProblem(fictional),null);
  for(const input of ['private-short-value','x'.repeat(129),`${fictional} `,`${fictional}é`]) assert(!runtimePasswordProblem(input).includes(input));
});
test('SCRAM verifier matches PostgreSQL password hashing with the server salt',async()=>{
  const db=new PGlite();
  try {
    await db.exec("SET password_encryption='scram-sha-256'; CREATE ROLE fictional_test LOGIN PASSWORD 'Fictional-test-only-password-123!'");
    const verifier=(await db.query("SELECT rolpassword FROM pg_authid WHERE rolname='fictional_test'")).rows[0].rolpassword;
    const salt=Buffer.from(verifier.split('$')[1].split(':')[1],'base64');
    assert.equal(runtimePasswordVerifier(fictional,salt),verifier);
    assert(!verifier.includes(fictional));
    assert.throws(()=>runtimePasswordVerifier('short'));
    assert.throws(()=>runtimePasswordVerifier(`${fictional}é`));
  } finally {await db.close();}
});
test('private runtime connection keeps the existing branch and uses encoded credentials',()=>{
  const app='postgresql://fictional:old@ep-fictional-pooler.eu-central-1.aws.neon.tech/jdpi_staff?sslmode=require';
  const operator=app.replace('-pooler.','.');
  const output=new URL(runtimeConnectionUrl(app,operator,fictional));
  assert.equal(output.username,'jdpi_workspace_runtime');
  assert.equal(decodeURIComponent(output.password),fictional);
  assert.equal(output.hostname,new URL(app).hostname);
  assert.throws(()=>runtimeConnectionUrl(app,operator.replace('ep-fictional','ep-other'),fictional));
  assert.throws(()=>runtimeConnectionUrl(app.replace('jdpi_staff','wrong'),operator,fictional));
});
