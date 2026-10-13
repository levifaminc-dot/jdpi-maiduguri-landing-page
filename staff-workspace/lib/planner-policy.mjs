export const OPERATIONS_PLAN_ID = 'r-fQrIItsE6jxqQS1HQ6oWUABgRH';
export const OPERATIONS_PLAN_URL = 'https://planner.cloud.microsoft/ui/web/plan/r-fQrIItsE6jxqQS1HQ6oWUABgRH/view/board?tid=2b64e4e5-af74-4b92-baab-b3621aef964d';

export function plannerEnabled(env) {
  return env.PLANNER_PILOT_ENABLED === 'true' || (env.NODE_ENV === 'development' && !env.VERCEL);
}

export function plannerTasks(payload, objectId) {
  if (!payload || !Array.isArray(payload.value)) throw new Error('Invalid Planner response');
  return payload.value.slice(0, 100).filter(task => typeof task.id === 'string' && typeof task.title === 'string')
    .map(task => ({
      id:task.id.slice(0, 150), title:task.title.trim().slice(0, 250) || 'Untitled task',
      status:task.percentComplete >= 100 ? 'Completed' : task.percentComplete > 0 ? 'In progress' : 'Not started',
      due:typeof task.dueDateTime === 'string' && !Number.isNaN(Date.parse(task.dueDateTime)) ? task.dueDateTime : null,
      assignedToMe:Object.keys(task.assignments || {}).some(id => id.toLowerCase() === objectId.toLowerCase()),
      assigneeCount:Object.keys(task.assignments || {}).length,
    }));
}
