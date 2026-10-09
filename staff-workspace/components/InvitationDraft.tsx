'use client';
import {useState} from 'react';
import Icon from './Icon';
import {invitationDraft, invitationOrigin} from '../lib/workspace-ui.mjs';
type Draft=ReturnType<typeof invitationDraft>;
export default function InvitationDraft({origin}:{origin:string}) {
  const [draft,setDraft]=useState<Draft|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
  const address=invitationOrigin(origin);
  async function copy(value:string) {
    try {await navigator.clipboard.writeText(value);setMessage('Copied. Paste it into your message.');}
    catch {setMessage('Copy is unavailable. Select the message text and copy it manually.');}
  }
  return <div className="ws-invitation-grid"><section className="ws-card"><h2>Invite by work email</h2><p className="ws-muted">Prepare a message for your colleague. No Microsoft object ID needed.</p>
    {address?.local && <p className="ws-notice"><strong>Local preview only.</strong> This address works on this computer, not on your colleague’s device. You can preview the message now; invitations can be sent after the workspace is deployed.</p>}
    {!address && <p className="ws-notice ws-notice-error">The workspace address needs to be configured before invitations can be prepared.</p>}
    <form className="ws-form" onSubmit={event=>{event.preventDefault();setError('');setMessage('');const data=new FormData(event.currentTarget);try{setDraft(invitationDraft(String(data.get('email')),String(data.get('name')),origin));}catch(err){setDraft(null);setError((err as Error).message);}}} onChange={()=>{setDraft(null);setError('');setMessage('');}}>
      <label htmlFor="colleague-email">Colleague’s work email<span className="ws-field-note">Required · use their JDPI work address</span></label><input id="colleague-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="colleague@jdpimaiduguri.org"/>
      <label htmlFor="colleague-name">Colleague’s name <span className="ws-optional">(optional)</span></label><input id="colleague-name" name="name" maxLength={150} autoComplete="name" placeholder="Their first name"/>
      <button className="ws-button" disabled={!address}><Icon name="mail"/>Prepare invitation message</button>
    </form><p className="ws-help-text">Preparing a message does not send an email, create a membership or grant access.</p>{error && <p className="ws-notice ws-notice-error" role="alert">{error}</p>}
    {draft && <section className="ws-draft" aria-labelledby="draft-heading"><h3 id="draft-heading">Your invitation message</h3><p><strong>Subject:</strong> {draft.subject}</p><label htmlFor="invitation-message">Message to copy</label><textarea id="invitation-message" rows={11} readOnly value={draft.body}/><div className="ws-inline-actions"><button className="ws-button ws-button-quiet" onClick={()=>copy(draft.body)}>Copy message</button>{!draft.local && <a className="ws-button" href={draft.mailto}>Open email app<Icon name="arrow"/></a>}</div>{draft.local?<p className="ws-help-text">This preview contains a local address. Do not send it to staff yet.</p>:<p className="ws-help-text">Your email app opens a draft. Review it and send it yourself; this workspace does not track delivery.</p>}</section>}
    <p role="status" className="ws-copy-status">{message}</p>
  </section><aside className="ws-invitation-aside"><section className="ws-card"><span className="ws-icon-tile"><Icon name="shield"/></span><h2>Simple to join. Safe to admit.</h2><ol className="ws-steps"><li><strong>Share the workspace link</strong><p>Send your colleague the prepared message using your usual email app.</p></li><li><strong>They sign in with Microsoft</strong><p>They use their JDPI work account and select “Request workspace access”.</p></li><li><strong>You approve their request</strong><p>Review them on the Members page. Every new approval starts as staff.</p></li></ol><p className="ws-help-text">The email and link are not access credentials. Only a verified Microsoft identity approved by an administrator can enter.</p></section><section className="ws-card"><h3>Workspace link</h3><p className="ws-muted">{address?.local?'Local preview address':'Share this with colleagues'}</p><code className="ws-link-code">{address?.url || 'Not configured'}</code>{address && <button className="ws-button ws-button-quiet" onClick={()=>copy(`${address.url}/`)}>Copy workspace link</button>}</section></aside></div>;
}
