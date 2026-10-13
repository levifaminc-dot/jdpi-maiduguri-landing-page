import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {plannerEnabled,plannerTasks,OPERATIONS_PLAN_ID} from '../lib/planner-policy.mjs';
import {joinPlannerTicket,openPlanner,sealPlanner,splitPlannerTicket} from '../lib/planner-seal.mjs';

test('pilot is enabled locally but must be opted into on Vercel',()=>{
  assert.equal(plannerEnabled({NODE_ENV:'development'}),true);
  assert.equal(plannerEnabled({NODE_ENV:'development',VERCEL:'1'}),false);
  assert.equal(plannerEnabled({NODE_ENV:'production'}),false);
  assert.equal(plannerEnabled({NODE_ENV:'production',PLANNER_PILOT_ENABLED:'true'}),true);
});
test('Planner task projection remains inside the fixed Operations plan',()=>{
  assert.equal(OPERATIONS_PLAN_ID,'r-fQrIItsE6jxqQS1HQ6oWUABgRH');
  const me='2b64e4e5-af74-4b92-baab-b3621aef964d';
  const tasks=plannerTasks({value:[{id:'one',title:' Prepare field visit ',percentComplete:50,dueDateTime:'2026-10-20T12:00:00Z',assignments:{[me.toUpperCase()]:{}}},
    {id:'two',title:'Done',percentComplete:100,assignments:{}},{id:'three',title:'To do',percentComplete:0,dueDateTime:'not a date'}]},me);
  assert.deepEqual(tasks.map(task=>task.status),['In progress','Completed','Not started']);
  assert.equal(tasks[0].assignedToMe,true);
  assert.equal(tasks[0].title,'Prepare field visit');
  assert.equal(tasks[2].due,null);
  assert.throws(()=>plannerTasks({value:{}},me));
});
test('Planner cookies are confidential and authenticated',()=>{
  const secret='x'.repeat(64), ticket={oid:'test',token:'fictional-token',expires:123};
  const encrypted=sealPlanner(ticket,secret);
  assert.equal(encrypted.includes(ticket.token),false);
  assert.deepEqual(openPlanner(encrypted,secret),ticket);
  assert.equal(openPlanner(`${encrypted.slice(0,-1)}${encrypted.endsWith('A')?'B':'A'}`,secret),null);
  assert.equal(openPlanner(encrypted,'y'.repeat(64)),null);
  assert.equal(openPlanner('bad',secret),null);
});
test('large encrypted Planner tickets fit two bounded cookies and fail closed when a part is missing',()=>{
  const secret='x'.repeat(64), ticket={oid:'test',token:'t'.repeat(3000),expires:123};
  const encrypted=sealPlanner(ticket,secret), parts=splitPlannerTicket(encrypted);
  assert.ok(parts);
  assert.ok(encrypted.length>3800);
  assert.ok(parts.every(part=>part.length<=2500));
  assert.deepEqual(openPlanner(joinPlannerTicket(...parts),secret),ticket);
  assert.equal(openPlanner(joinPlannerTicket(parts[0],undefined),secret),null);
  assert.equal(joinPlannerTicket(parts[0],parts[1]+'x'.repeat(2501)),null);
  assert.equal(splitPlannerTicket('x'.repeat(5001)),null);
});
test('real workspace leaf checks current active membership and Graph remains read-only',async()=>{
  const page=await readFile(new URL('../app/workspace/tasks/page.tsx',import.meta.url),'utf8');
  const graph=await readFile(new URL('../lib/planner.ts',import.meta.url),'utf8');
  const connect=await readFile(new URL('../app/api/planner/connect/route.ts',import.meta.url),'utf8');
  const callback=await readFile(new URL('../app/api/planner/callback/route.ts',import.meta.url),'utf8');
  assert.match(page,/await requireWorkspacePage\(\)/);
  assert.match(connect,/await requireActiveMember\(request.headers\)/);
  assert.match(callback,/await requireActiveMember\(request.headers\)/);
  assert.match(graph,/graph.microsoft.com\/v1\.0\/planner\/plans\/\$\{OPERATIONS_PLAN_ID\}\/tasks/);
  assert.match(graph,/cache:'no-store'/);
  assert.doesNotMatch(graph,/(?:method:\s*'POST'|method:\s*'PATCH'|method:\s*'DELETE')/);
});
