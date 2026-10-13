import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import MemberShell,{PageHeading} from '../../../components/MemberShell';
import OperationsBoard from '../../../components/OperationsBoard';
import {allowLocalPreview} from '../../../lib/preview-policy.mjs';
import type {PilotTask} from '../../../lib/planner';
export const dynamic='force-dynamic';
const samples:PilotTask[]=[
  {id:'sample-1',title:'Review monthly field update template',status:'Not started',due:'2026-10-19T12:00:00Z',assignedToMe:true,assigneeCount:1},
  {id:'sample-2',title:'Confirm logistics checklist for the team visit',status:'Not started',due:null,assignedToMe:false,assigneeCount:2},
  {id:'sample-3',title:'Prepare the Operations pilot check-in',status:'In progress',due:'2026-10-16T12:00:00Z',assignedToMe:true,assigneeCount:2},
  {id:'sample-4',title:'Set up the private pilot plan',status:'Completed',due:'2026-10-12T12:00:00Z',assignedToMe:false,assigneeCount:1},
];
export default async function TasksPreviewPage({searchParams}:{searchParams:Promise<{view?:string}>}) {
  if (!allowLocalPreview({nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,host:(await headers()).get('host')})) notFound();
  const view=(await searchParams).view==='mine'?'mine':'all';
  return <MemberShell name="Preview colleague" role="STAFF" page="Operations tasks"><PageHeading eyebrow="OPERATIONS PILOT" title="One plan. Clear next steps." description="See the Operations team’s current tasks here, then open Microsoft Planner when you need to make a change."/><OperationsBoard tasks={samples} view={view} preview/></MemberShell>;
}
