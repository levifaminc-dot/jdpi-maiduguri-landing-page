import test from 'node:test';
import assert from 'node:assert/strict';
import {allowLocalPreview,canManageMembers} from '../lib/preview-policy.mjs';
test('preview is loopback development only', () => {
  assert.equal(allowLocalPreview({nodeEnv:'development',host:'127.0.0.1:4330'}),true);
  assert.equal(allowLocalPreview({nodeEnv:'development',host:'localhost:4330'}),true);
  for (const host of ['attacker.invalid','staff.jdpimaiduguri.org','127.0.0.1.attacker.invalid']) assert.equal(allowLocalPreview({nodeEnv:'development',host}),false);
  assert.equal(allowLocalPreview({nodeEnv:'production',host:'localhost:4330'}),false);
  assert.equal(allowLocalPreview({nodeEnv:'development',host:'localhost:4330',vercel:'1'}),false);
});
test('only active admins may manage membership', () => {
  assert.equal(canManageMembers({status:'Active',role:'Admin'}),true);
  for (const actor of [null,{status:'Active',role:'Staff'},{status:'Pending',role:'Admin'},{status:'Suspended',role:'Admin'}, {role:'Admin'}]) assert.equal(canManageMembers(actor),false);
});
