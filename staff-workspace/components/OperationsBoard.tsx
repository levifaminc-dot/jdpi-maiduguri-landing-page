import Link from 'next/link';
import Icon from './Icon';
import type {PilotTask} from '../lib/planner';
import {OPERATIONS_PLAN_URL} from '../lib/planner-policy.mjs';

const columns=['Not started','In progress','Completed'];
export default function OperationsBoard({tasks,view,more=false,preview=false}:{tasks:PilotTask[];view:'all'|'mine';more?:boolean;preview?:boolean}) {
  const visible=view==='mine'?tasks.filter(task=>task.assignedToMe):tasks;
  const date=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'});
  return <>
    <div className="ws-planner-toolbar"><nav className="ws-filters" aria-label="Task views">
      <Link className="ws-filter" href={preview?'/preview/tasks':'/workspace/tasks'} aria-current={view==='all'?'page':undefined} prefetch={false}>All Operations tasks</Link>
      <Link className="ws-filter" href={preview?'/preview/tasks?view=mine':'/workspace/tasks?view=mine'} aria-current={view==='mine'?'page':undefined} prefetch={false}>Assigned to me</Link>
    </nav><a className="ws-button ws-button-quiet" href={OPERATIONS_PLAN_URL} target="_blank" rel="noopener noreferrer">Open in Planner <Icon name="arrow"/></a></div>
    {preview && <p className="ws-notice">Local design preview only. These are fictional tasks; no Microsoft tasks or staff data are loaded.</p>}
    <div className="ws-planner-summary" aria-label="Task status summary">{columns.map(column=><div className="ws-planner-count" key={column}><strong>{visible.filter(task=>task.status===column).length}</strong><span>{column}</span></div>)}</div>
    <div className="ws-planner-columns">{columns.map(column=><section className="ws-planner-column" key={column} aria-label={`${column} tasks`}><h2>{column}<span>{visible.filter(task=>task.status===column).length}</span></h2>
      {visible.filter(task=>task.status===column).map(task=><article className="ws-card ws-planner-task" key={task.id}><h3>{task.title}</h3><div className="ws-planner-meta">{task.due?<span><Icon name="clock"/>Due {date.format(new Date(task.due))}</span>:<span>No due date</span>}<span>{task.assignedToMe?'Assigned to you':task.assigneeCount?`${task.assigneeCount} assigned`:'Unassigned'}</span></div></article>)}
      {!visible.some(task=>task.status===column) && <p className="ws-planner-empty">No {column.toLowerCase()} tasks in this view.</p>}
    </section>)}</div>
    {more && <p className="ws-help-text">This view shows the first 100 tasks. Open Planner for the complete plan.</p>}
    <p className="ws-help-text">Task changes are made in Microsoft Planner. This workspace view is read-only and respects your Microsoft plan membership.</p>
  </>;
}
