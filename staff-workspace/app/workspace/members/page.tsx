import Link from 'next/link';
import MemberShell, {PageHeading} from '../../../components/MemberShell';
import {MembershipAdmin} from '../../../components/Membership';
import Icon from '../../../components/Icon';
import {requireWorkspacePage} from '../../../lib/workspace-page';
export const dynamic='force-dynamic';
export default async function MembersPage({searchParams}:{searchParams:Promise<{status?:string}>}) {
  const {identity,member,overview}=await requireWorkspacePage(true);
  const requested=(await searchParams).status;
  const filter=requested && ['ALL','ACTIVE','PENDING','SUSPENDED','INVITED'].includes(requested)?requested:'ALL';
  return <MemberShell name={identity.name} role={member.role} page="Members"><PageHeading eyebrow="ADMINISTRATION" title="Members" description="Welcome colleagues, review requests and manage workspace access." action={<Link className="ws-button" href="/workspace/invitations" prefetch={false}><Icon name="mail"/>Invite a colleague</Link>}/><MembershipAdmin key={filter} members={overview!.members} currentObjectId={identity.objectId} initialFilter={filter}/></MemberShell>;
}
