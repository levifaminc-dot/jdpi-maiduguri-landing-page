'use client';
import {useState} from 'react';
import {createAuthClient} from 'better-auth/react';
const authClient = createAuthClient();

export function MicrosoftSignIn({ready}:{ready:boolean}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState(false);
  async function signIn() {
    setBusy(true); setError(false);
    try {
      const result = await authClient.signIn.social({provider:'microsoft', callbackURL:'/workspace', errorCallbackURL:'/auth/error'});
      if (result.error) {setError(true); setBusy(false);}
    } catch {setError(true); setBusy(false);}
  }
  return <><button className="microsoft-button" disabled={!ready || busy} onClick={signIn}><span className="microsoft-mark" aria-hidden="true"><i/><i/><i/><i/></span>{busy ? 'Connecting to Microsoft…' : 'Sign in with Microsoft'}</button>{error && <p className="auth-error" role="alert">We couldn’t start Microsoft sign-in. Please try again or contact the workspace administrator.</p>}</>;
}

export function MicrosoftSignOut({compact=false}:{compact?:boolean}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState(false);
  return <><button className={compact?'ws-button ws-button-quiet':'button secondary'} disabled={busy} onClick={async () => {
    setBusy(true); setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {setError(true); setBusy(false);return;}
      window.location.assign('/');
    } catch {setError(true); setBusy(false);}
  }}>{busy ? 'Signing out…' : compact?'Sign out':'Sign out of workspace'}</button>{error && <p role="alert">Sign-out failed. Please try again.</p>}</>;
}
