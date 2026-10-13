import MemberShell from '../../../components/MemberShell';
import StaffDirectory from '../../../components/StaffDirectory';
import {requireWorkspacePage} from '../../../lib/workspace-page';
import {staffDirectory} from '../../../lib/staff-directory.mjs';
export const dynamic='force-dynamic';
export default async function DirectoryPage(){
  const {identity,member,pool}=await requireWorkspacePage();
  let data;try{data=await staffDirectory(pool,identity);}catch{return <MemberShell name={identity.name} role={member.role} page="Staff directory"><p className="ws-notice">The staff directory is temporarily unavailable. Please try again later.</p></MemberShell>;}
  return <MemberShell name={identity.name} role={member.role} page="Staff directory"><StaffDirectory initialPeople={data.people} actor={data.actor}/></MemberShell>;
}
