import 'server-only';
import {cookies} from 'next/headers';
import {microsoftConfig} from './microsoft-policy.mjs';
import {openPlanner} from './planner-seal.mjs';
import {OPERATIONS_PLAN_ID, plannerEnabled, plannerTasks} from './planner-policy.mjs';

export type PilotTask={id:string;title:string;status:string;due:string|null;assignedToMe:boolean;assigneeCount:number};
type PlannerTicket={oid:string;tenant:string;token:string;expires:number};

export function plannerConfig() {
  if (!plannerEnabled(process.env)) return null;
  return microsoftConfig(process.env);
}
export function plannerCookieName(origin:string) {return origin.startsWith('https:')?'__Host-jdpi-planner':'jdpi-planner';}
export function plannerStateCookieName(origin:string) {return origin.startsWith('https:')?'__Host-jdpi-planner-state':'jdpi-planner-state';}
export function plannerCookieOptions(origin:string,maxAge:number) {
  return {httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax' as const,path:'/',maxAge};
}
export async function plannerTicket(identity:{objectId:string;tenantId:string}):Promise<PlannerTicket|null> {
  const config=plannerConfig();
  if (!config) return null;
  const value=(await cookies()).get(plannerCookieName(config.origin))?.value;
  const ticket=openPlanner(value,config.secret);
  if (!ticket || ticket.oid!==identity.objectId || ticket.tenant!==identity.tenantId ||
      typeof ticket.token!=='string' || ticket.token.length>3000 || !Number.isSafeInteger(ticket.expires) || ticket.expires<Date.now()+30_000) return null;
  return ticket as PlannerTicket;
}
export async function operationsTasks(ticket:PlannerTicket,objectId:string):Promise<{tasks:PilotTask[];more:boolean;denied:boolean}> {
  const url=`https://graph.microsoft.com/v1.0/planner/plans/${OPERATIONS_PLAN_ID}/tasks`;
  const response=await fetch(url,{headers:{Authorization:`Bearer ${ticket.token}`,Accept:'application/json'},
    cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10_000)});
  if (response.status===401 || response.status===403) return {tasks:[],more:false,denied:true};
  if (!response.ok) throw new Error('Planner unavailable');
  const payload=await response.json();
  return {tasks:plannerTasks(payload,objectId),more:!!payload['@odata.nextLink'],denied:false};
}
