import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {runtimePasswordProblem,runtimeActivationSql,runtimeConnectionUrl,runtimeRecovery} from '../lib/runtime-password.mjs';

const fictional='Fictional-test-only-password-123!';
test('password feedback identifies the requirement without revealing input',()=>{
  assert.match(runtimePasswordProblem('private-short-value'),/at least 24/);
  assert.match(runtimePasswordProblem('x'.repeat(129)),/no more than 128/);
  assert.match(runtimePasswordProblem(`${fictional} `),/without spaces/);
  assert.match(runtimePasswordProblem(`${fictional}é`),/accents/);
  assert.equal(runtimePasswordProblem(fictional),null);
  for(const input of ['private-short-value','x'.repeat(129),`${fictional} `,`${fictional}é`]) assert(!runtimePasswordProblem(input).includes(input));
});
test('Neon activation uses the original password safely escaped for the fixed limited role',async()=>{
  const db=new PGlite();
  try {
    await db.exec("SET password_encryption='scram-sha-256'; CREATE ROLE jdpi_workspace_runtime NOLOGIN; CREATE TABLE escape_guard(id int)");
    // Parse the exact E-string and compare privately in the fixture. Include
    // quotes, backslashes, dollar signs and SQL punctuation; no real secrets.
    for(const mode of ['on','off']) {
      await db.exec(`SET standard_conforming_strings=${mode}`);
      for(const input of [fictional,`${fictional}'\\$;--/*()`,`${fictional}\\'\\\\'';--`]) {
        const sql=runtimeActivationSql(input);
        assert.match(sql,/^ALTER ROLE jdpi_workspace_runtime LOGIN PASSWORD E'/);
        const literal=sql.split(' PASSWORD ')[1];
        assert.equal((await db.query(`SELECT ${literal} AS password`)).rows[0].password,input);
        await db.exec(sql);
        const row=(await db.query("SELECT rolcanlogin,rolpassword FROM pg_authid WHERE rolname='jdpi_workspace_runtime'")).rows[0];
        assert.equal(row.rolcanlogin,true);
        assert.match(row.rolpassword,/^SCRAM-SHA-256\$/);
      }
    }
    assert.equal((await db.query("SELECT count(*)::int AS n FROM escape_guard")).rows[0].n,0);
    assert.throws(()=>runtimeActivationSql('short'));
    assert.throws(()=>runtimeActivationSql(`${fictional}é`));
    assert.throws(()=>runtimeActivationSql(`SCRAM-SHA-256$${fictional}`));
    assert.throws(()=>runtimeActivationSql(`md5${'a'.repeat(32)}`));
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

test('resume validates a limited recovery connection without overwriting or accepting owner credentials',()=>{
  const operator='postgresql://fictional:old@ep-fictional.eu-central-1.aws.neon.tech/jdpi_staff?sslmode=require';
  const pooled=operator.replace('ep-fictional.','ep-fictional-pooler.');
  const connection=runtimeConnectionUrl(pooled,operator,fictional);
  const recovered=runtimeRecovery(`# private fixture\nDATABASE_URL=${connection}\n`,operator);
  assert.equal(recovered.password,fictional);
  assert.equal(recovered.connection,connection);
  assert.throws(()=>runtimeRecovery(`DATABASE_URL=${pooled}`,operator));
  assert.throws(()=>runtimeRecovery(`DATABASE_URL=${connection}\nDATABASE_MIGRATION_URL=${operator}`,operator));
  assert.throws(()=>runtimeRecovery(`DATABASE_URL=${connection}`,operator.replace('ep-fictional.','ep-other.')));
  assert.throws(()=>runtimeRecovery('x'.repeat(4097),operator));
});
