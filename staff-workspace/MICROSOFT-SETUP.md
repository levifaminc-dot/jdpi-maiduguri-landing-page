# Microsoft connection — 8 October 2026

## Entra registration

- Name: JDPI Staff Workspace, single tenant / JDPI organisation only.
- Tenant: `2b64e4e5-af74-4b92-baab-b3621aef964d`.
- Application/client ID: `80ceea92-5a36-4e3e-a73b-51742b72ce35`.
- Registration object ID: `68ce2681-92c7-49b9-beab-ea2a82cd0688`.
- Web callback: `http://localhost:4330/api/auth/callback/microsoft`.
- User approved personal consent for tayo@jdpimaiduguri.org only. The organisation-
  wide consent checkbox was explicitly cleared before Accept. No organisational
  admin consent or staff-role assignment performed.

The old JDPI Intranet Portal registration
(`bc9285ff-24e9-4049-b075-a063fe873fcf`) was soft-deleted at the user's request.
It appears in Entra App registrations → Deleted applications, deleted 8 October
2026. Microsoft provides a 30-day restoration window. Do not permanently purge it.
The old app can no longer sign in users or access protected resources.

## Private local setup

1. Run `node scripts/prepare-microsoft-env.mjs`. It adds missing keys to ignored
   `.env.local`, creates a random application-session secret and prints no values.
   It preserves existing settings. The Microsoft credential is deliberately blank.
2. The tenant administrator must create the new app's client secret in Entra →
   Certificates & secrets → Client secrets. Use an appropriately short expiry and
   record an organisational rotation reminder. Copy the **Value**, not Secret ID.
3. Enter it as `MICROSOFT_CLIENT_SECRET` in `.env.local`, never chat or Git. No
   credential may have a `NEXT_PUBLIC_` prefix. Keep this file private on the PC.
4. Restart `npm run dev` and open `http://localhost:4330/`. The fixed localhost
   origin must match Microsoft's registered callback. An enabled connection
   redirects the old 127.0.0.1 sign-in URL to localhost to keep cookies consistent.
5. Test Microsoft sign-in, expected identity consent, callback and local sign-out.
   Stop for unexpected permissions. Do not consent for the whole organisation.

## Security and scope

- Better Auth 1.7.7 generic Entra helper requires OIDC discovery/JWKS verification.
  ID tokens are checked cryptographically for issuer, audience, expiry and nonce.
  OAuth state and PKCE protect the redirect flow. Missing verification metadata
  fails closed. The profile mapper independently checks the exact JDPI tenant.
- Only `openid profile email` scopes are requested; no Graph/mailbox/file calls,
  offline access or refresh-token permission. Email is not used to authorise or
  link accounts. The identity key is the immutable tenant ID plus object ID.
- Only redirect login, its Microsoft callback, get-session and sign-out routes
  are exposed. Direct client-supplied ID-token login, account linking, profile
  editing, access-token reads and role/admin mutation endpoints are blocked.
- Signed-in users reach an identity-verification/admission-setup notice ONLY.
  No real announcements, directory or files are exposed. No user becomes an
  active member or administrator as a consequence of sign-in.
- Identity-only setup sessions use encrypted HttpOnly, SameSite=Lax cookies,
  Secure on HTTPS, fixed 15-minute expiry and no automatic refresh. Provider token
  cookies are disabled; application-only sign-out leaves Microsoft apps signed in.
- Script CSP uses a fresh nonce per dynamically rendered request, not production
  `unsafe-inline` JavaScript. Inline styles remain allowed for the existing UI.
- No database is connected. Stateless setup sessions cannot be centrally revoked
  immediately; they expire in 15 minutes. This is NOT suitable for admitting staff
  or serving private documents. Add durable sessions and server-side ACTIVE
  membership checks, audit logging and shared rate limiting before staff release.
- Future first-admin bootstrap must be explicit, audited and matched to a verified
  tenant/object identity. The email setting is planning metadata, not an elevation
  rule. Never grant admin on each login based on an email or client-supplied claim.

## Hosting

No Vercel deployment was made for this connection. Before release, use a separate
staff-workspace Vercel project, an approved HTTPS origin/Entra Web callback,
protected environment settings, PostgreSQL and private document storage. Keep
the public Astro site, Sanity Studio, WordPress and mail DNS unchanged.

## Verification

TypeScript, production build and policy tests passed during implementation.
Seven automated tests passed, including an isolated signed OIDC redirect exchange,
encrypted-session identity persistence, state/cookie checks, sign-out, and
rejection of wrong tenant/issuer/audience/nonce, expired tokens and bad signatures.
Unconfigured sign-in returns 503; blocked profile mutation returns 404. The local
screen correctly keeps sign-in disabled before the Microsoft credential is saved.
The real Microsoft browser flow passed on 8 October 2026 after the administrator
corrected the private client-secret **Value**. Personal consent remains limited
to the approved test account. The callback reached `/workspace` with verified
JDPI identity, and the encrypted session persisted after a browser refresh.
Application sign-out returned to the sign-in page; navigating directly to
`/workspace` afterwards redirected back to sign-in. No membership or role was
granted, and private staff content remained locked. Earlier attempts returned
`AADSTS7000215` because an invalid credential was configured; that local setup
blocker is now resolved. The secret remains in ignored `.env.local`, not Git.
Isolated mock-OIDC tests use fictional identities/tokens, not a real login.
Only numeric Microsoft error codes are logged; provider messages/token data are
discarded. Development request-URL logging is disabled to avoid callback codes
being printed. A localhost normalization loop was fixed and HTTP-verified.
The production build was tested on loopback port 4331: no demo links, preview
and sample-asset routes 404, unauthenticated workspace redirects, and script CSP
has no unsafe-inline. The temporary production test server was then stopped.
Runtime request checks reject foreign browser Origins (403), direct ID-token
sign-in bodies (400), and profile/role mutation endpoints (404).

References:

- https://better-auth.com/docs/plugins/generic-oauth
- https://better-auth.com/docs/concepts/session-management
- https://learn.microsoft.com/en-us/entra/identity-platform/howto-restore-app
- https://learn.microsoft.com/en-us/entra/identity-platform/reply-url
