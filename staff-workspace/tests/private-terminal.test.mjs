import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough,Writable} from 'node:stream';
import {privateTerminal} from '../lib/private-terminal.mjs';

test('one console reader completes confirmation and two hidden entries without echo',async()=>{
  const input=new PassThrough();
  let captured='',rawStarts=0;
  input.isTTY=true;input.setRawMode=value=>{if(value)rawStarts++;};
  const output=new Writable({write(chunk,_encoding,done){captured+=chunk.toString();done();}});
  output.columns=100;
  const prompt=privateTerminal(input,output);
  try {
    const confirm=prompt.visible('Confirm: ');
    input.write('INITIALISE\r');
    assert.equal(await confirm,'INITIALISE');
    const first=prompt.secret('New password (hidden): ');
    input.write('fictional-password-not-real\r');
    assert.equal(await first,'fictional-password-not-real');
    const second=prompt.secret('Confirm password (hidden): ');
    input.write('fictional-password-not-real\r');
    assert.equal(await second,'fictional-password-not-real');
    assert.equal(rawStarts,1);
    assert(!captured.includes('fictional-password-not-real'));
    assert(captured.includes('Confirm password (hidden): '));
  } finally {prompt.close();input.destroy();output.destroy();}
});

test('Ctrl+C aborts a hidden prompt instead of leaving an unanswered question',async()=>{
  const input=new PassThrough();input.isTTY=true;input.setRawMode=()=>{};
  let captured='';
  const output=new Writable({write(chunk,_encoding,done){captured+=chunk.toString();done();}});
  const prompt=privateTerminal(input,output);
  try {
    const question=prompt.secret('Hidden: ');
    input.write('fictional-only\x03');
    await assert.rejects(question,{name:'AbortError'});
    assert(!captured.includes('fictional-only'));
  } finally {prompt.close();input.destroy();output.destroy();}
});
