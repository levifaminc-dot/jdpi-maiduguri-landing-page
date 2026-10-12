import {notFound} from 'next/navigation';
import MemberShell,{PageHeading} from '../../../components/MemberShell';
import StaffDepartments from '../../../components/StaffDepartments';
import {requireWorkspacePage} from '../../../lib/workspace-page';
import {staffDepartments} from '../../../lib/staff-departments.mjs';
export const dynamic='force-dynamic';
export default async function DepartmentsPage(){
  const {identity,member,pool}=await requireWorkspacePage();if(process.env.STAFF_TAGGING_ENABLED!=='true')notFound();
  let data;try{data=await staffDepartments(pool,identity);}catch{return <MemberShell name={identity.name} role={member.role} page="Departments"><p className="ws-notice">Departments are temporarily unavailable.</p></MemberShell>;}
  return <MemberShell name={identity.name} role={member.role} page="Departments"><PageHeading eyebrow="APPROVED WORK ASSIGNMENTS" title="Staff departments" description="These approved department assignments determine department-based PDF access. They do not admit staff or change membership roles."/><p className="ws-notice">Only active, approved members appear here. No Microsoft export has been imported. Admins can assign department editors; editors cannot admit or suspend anyone.</p><StaffDepartments {...data}/></MemberShell>;
}
