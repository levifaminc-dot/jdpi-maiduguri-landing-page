import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createRuntimeRoleSql,runtimeGrantsSql,verifyRuntimeRole} from '../lib/runtime-role-policy.mjs';

test('runtime provisioning is explicit and cannot interpolate arbitrary database identifiers',()=>{
  assert.match(createRuntimeRoleSql,/NOLOGIN/);
  assert.match(createRuntimeRoleSql,/NOCREATEROLE/);
  assert.throws(()=>runtimeGrantsSql('database"; DROP ROLE x; --'));
});

test('limited role supports runtime locks and rejects effective dangerous grants',async()=>{
  const db=new PGlite();
  try {
    for(const name of ['000-auth.sql','001-membership.sql']) await db.exec(await readFile(new URL(`../database/${name}`,import.meta.url),'utf8'));
    await db.exec('CREATE TABLE workspace_migration(name text PRIMARY KEY)');
    const database=(await db.query('SELECT current_database() AS name')).rows[0].name;
    await db.exec(createRuntimeRoleSql);
    await db.exec(runtimeGrantsSql(database));
    assert.deepEqual(await verifyRuntimeRole(db),{loginEnabled:false});
    await db.exec('BEGIN; SET LOCAL ROLE jdpi_workspace_runtime');
    await db.query('SELECT id FROM public.workspace_control WHERE id=1 FOR UPDATE');
    await db.exec('ROLLBACK');
    await db.exec('GRANT UPDATE ON workspace_audit TO jdpi_workspace_runtime');
    await assert.rejects(verifyRuntimeRole(db));
    await db.exec('REVOKE UPDATE ON workspace_audit FROM jdpi_workspace_runtime');
    await db.exec('GRANT CREATE ON SCHEMA public TO PUBLIC');
    await assert.rejects(verifyRuntimeRole(db));
  } finally {await db.close();}
});
