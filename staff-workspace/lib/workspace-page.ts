import 'server-only';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {requireActiveMember} from './workspace-access';
import {AccessError, adminOverview} from './membership.mjs';

// Called by every leaf page; a cached layout is not an authorization boundary.
export async function requireWorkspacePage(admin=false) {
  let context;
  try {context=await requireActiveMember(await headers());}
  catch(error) {if(error instanceof AccessError && error.status===401) redirect('/'); redirect('/workspace');}
  if(admin && context.member.role!=='ADMIN') redirect('/workspace');
  let overview=null;
  if(admin) {
    try {overview=await adminOverview(context.pool,context.identity);}
    catch {redirect('/workspace');}
  }
  return {...context,overview};
}
