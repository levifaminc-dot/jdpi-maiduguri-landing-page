import test from 'node:test';
import assert from 'node:assert/strict';
import {socialLinks} from '../src/lib/socials.ts';

test('all five verified platforms include the organisation-supplied YouTube channel',()=>{
  const links=socialLinks();
  assert.deepEqual(links.map(link=>link.icon),['facebook','instagram','x','linkedin','youtube']);
  assert.equal(links.find(link=>link.icon==='youtube').url,'https://www.youtube.com/@jdpimaiduguri');
});
test('editor destinations take priority without duplicate platforms',()=>{
  const links=socialLinks([{label:'Our channel',url:'https://youtube.com/@approved'},{label:'Twitter',url:'https://twitter.com/approved'},{label:'Duplicate',url:'https://x.com/duplicate'}]);
  assert.equal(links.length,5);
  assert.equal(links.find(link=>link.icon==='youtube').url,'https://youtube.com/@approved');
  assert.equal(links.find(link=>link.icon==='x').url,'https://twitter.com/approved');
});
test('invalid and credential-bearing URLs are rejected; labels cannot impersonate platform icons',()=>{
  const links=socialLinks([{label:'Bad',url:'javascript:alert(1)'},{label:'Bad',url:'https://user:password@example.org/'},{label:'Bad',url:'http://example.org/'},{label:'Bad',url:'not a url'},{label:'Facebook',url:'https://example.org/'}]);
  assert.equal(links.length,6);
  assert.equal(links.find(link=>link.url==='https://example.org/').icon,undefined);
});
