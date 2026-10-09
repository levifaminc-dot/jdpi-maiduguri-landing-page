import MemberShell, {PageHeading} from '../../../components/MemberShell';
import InvitationDraft from '../../../components/InvitationDraft';
import {requireWorkspacePage} from '../../../lib/workspace-page';
import {invitationOrigin} from '../../../lib/workspace-ui.mjs';
export const dynamic='force-dynamic';
export default async function InvitationsPage() {
  const {identity,member}=await requireWorkspacePage(true);
  const configured=invitationOrigin(process.env.BETTER_AUTH_URL ?? '');
  return <MemberShell name={identity.name} role={member.role} page="Invitations"><PageHeading eyebrow="ADMINISTRATION" title="Invite your colleagues" description="Start with a work email. Approve access after your colleague signs in."/><InvitationDraft origin={configured?.url ?? ''}/></MemberShell>;
}
