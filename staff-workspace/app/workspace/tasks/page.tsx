import Link from 'next/link';
import {notFound} from 'next/navigation';
import MemberShell,{PageHeading} from '../../../components/MemberShell';
import OperationsBoard from '../../../components/OperationsBoard';
import Icon from '../../../components/Icon';
import {requireWorkspacePage} from '../../../lib/workspace-page';
import {operationsTasks,plannerConfig,plannerTicket} from '../../../lib/planner';

export const dynamic='force-dynamic';
export default async function TasksPage({searchParams}:{searchParams:Promise<{view?:string;connection?:string}>}) {
  if (!plannerConfig()) notFound();
  const {identity,member}=await requireWorkspacePage();
  const params=await searchParams;
  const view=params.view==='mine'?'mine':'all';
  const ticket=await plannerTicket(identity);
  let data=null,error=false;
  if (ticket) try {data=await operationsTasks(ticket,identity.objectId);} catch {error=true;}
  return <MemberShell name={identity.name} role={member.role} page="Operations tasks">
    <PageHeading eyebrow="OPERATIONS PILOT" title="One plan. Clear next steps." description="See the Operations team’s current tasks here, then open Microsoft Planner when you need to make a change."/>
    {!ticket?<section className="ws-card ws-planner-connect"><span className="ws-icon-tile"><Icon name="check"/></span><div><h2>Connect your Planner access</h2><p>Microsoft will ask for permission to read your tasks. Only tasks from the JDPI Operations pilot plan appear here. You must already belong to that private plan.</p>{params.connection==='failed' && <p className="ws-notice ws-notice-error" role="alert">Planner connection was not completed. Please try again or ask the workspace administrator to check your plan access.</p>}<a className="ws-button" href="/api/planner/connect">Connect Microsoft Planner <Icon name="arrow"/></a></div></section>
      :error?<section className="ws-card"><h2>Tasks are temporarily unavailable</h2><p>We couldn’t load the Operations plan. Your workspace access and task data have not changed.</p><Link className="ws-button ws-button-quiet" href="/workspace/tasks" prefetch={false}>Try again</Link></section>
      :data?.denied?<section className="ws-card"><h2>Operations plan access needed</h2><p>This Microsoft account cannot read the private Operations pilot plan, or its Planner connection has expired. Ask the plan owner to confirm your group membership.</p><a className="ws-button ws-button-quiet" href="/api/planner/connect">Reconnect Planner</a></section>
      :data?<OperationsBoard tasks={data.tasks} more={data.more} view={view}/>:null}
  </MemberShell>;
}
