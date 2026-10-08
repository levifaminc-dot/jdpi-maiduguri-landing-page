import {redirect} from 'next/navigation';
import {headers} from 'next/headers';
import {getAuth} from '../../lib/auth';
import {verifiedIdentity} from '../../lib/microsoft-policy.mjs';
import {MicrosoftSignOut} from '../../components/MicrosoftSignIn';
export const dynamic = 'force-dynamic';
export default async function WorkspacePage() {
  const auth = getAuth();
  if (!auth) redirect('/');
  let session;
  try {session = await auth.api.getSession({headers:await headers()});} catch {redirect('/auth/error');}
  if (!session || !verifiedIdentity(session.user)) redirect('/');
  // Identity verification does not imply membership. Never render private staff
  // content or assign a role until an ACTIVE membership is checked server-side.
  return <main className="identity-page"><section className="identity-card"><p className="eyebrow">JDPI STAFF WORKSPACE</p><span className="identity-check" aria-hidden="true">✓</span><h1>Welcome, {session.user.name}.</h1><p>Your JDPI Microsoft identity has been verified.</p><div className="admission-note"><strong>Workspace admission is not yet enabled.</strong><p>The staff membership database is still being connected. Your account has not been admitted or assigned a role. Announcements, documents and staff details remain locked.</p></div><p className="muted">This setup session expires after 15 minutes. Signing out here does not sign you out of other Microsoft applications.</p><MicrosoftSignOut/></section></main>;
}
