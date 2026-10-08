import {headers} from 'next/headers';
import {allowLocalPreview} from '../lib/preview-policy.mjs';
import {microsoftConfig} from '../lib/microsoft-policy.mjs';
import {MicrosoftSignIn} from '../components/MicrosoftSignIn';
export const dynamic = 'force-dynamic';
export default async function SignInPage() {
  const h = await headers();
  const demo = allowLocalPreview({nodeEnv:process.env.NODE_ENV,vercel:process.env.VERCEL,host:h.get('host')});
  const ready = !!microsoftConfig(process.env);
  return <main className="login-page">
    <section className="login-purpose"><p className="login-wordmark">JDPI<span>STAFF WORKSPACE</span></p><div><p className="eyebrow">ONE TEAM. A SHARED PURPOSE.</p><h1>Connected in service.<br/>United in purpose.</h1><p>A shared space for our people, our ideas and the knowledge that makes our work possible.</p></div><small>Justice Development and Peace Initiative · Maiduguri</small></section>
    <section className="login-entry"><div className="login-card"><p className="eyebrow">WELCOME TO YOUR WORKSPACE</p><h2>Good work starts<br/>with connection.</h2><p className="muted">Use your JDPI Microsoft work account to verify your identity.</p>
      <MicrosoftSignIn ready={ready}/><p className="setup-note">{ready ? 'JDPI accounts only. Identity verification does not grant workspace access.' : 'Microsoft registration is ready. A private credential is still needed to enable sign-in.'}</p>
      <div className="admission-note"><strong>Access is invitation-only.</strong><p>A workspace admin must invite or admit you. A Microsoft account alone does not grant access or an admin role. Staff admission is not enabled in this setup version.</p></div>
      {demo && <div className="demo-entry"><span>LOCAL PREVIEW · FICTIONAL DATA ONLY</span><div><a className="button secondary" href="/preview?role=Staff">Explore as staff</a><a className="button primary" href="/preview?role=Admin">Explore as admin</a></div><p>No Microsoft account is used. These are sample views, not authentication.</p></div>}
      <p className="login-help">Need access? Contact JDPI’s designated workspace administrator.</p>
    </div></section>
  </main>;
}
