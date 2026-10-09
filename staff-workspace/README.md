# JDPI staff workspace - Microsoft sign-in and membership

This separate Next.js project replaces the proposed Laravel/Namecheap direction.
It does not replace the Astro public website or the Sanity Studio. No staff data
is stored in the marketing CMS. The original vanilla preview is retained in
`../staff-preview` as a recovery version.

## Run locally

1. `npm ci` within this folder.
2. `npm run dev` (or `npm run staff:preview` from the repository root).
3. Open http://127.0.0.1:4330/ for the sign-in design.
4. Sign in with the JDPI Microsoft work account. Approved members land on the
   real `/workspace` dashboard. Nonmembers see the admission-request screen.
5. **Explore as staff** / **Explore as admin** are isolated fictional DEMO views,
   available only in local development. They are not the real workspace.

`npm run check`, `npm test` and `npm run build` verify the foundation. Dependencies
are pinned in this project's independent package-lock. The PDF worker and fonts
are prepared from the installed dependency before dev/build, not an external CDN.

## Current capabilities and limits

The real workspace now uses Microsoft sign-in with durable Neon PostgreSQL
sessions and membership. The explicitly approved first administrator is active.
Admin sign-in lands on a dashboard with real membership counts and access
activity. Dedicated pages are available at:

- `/workspace/members`: name search, access-status filters, admission, suspension,
  restoration and role changes. Changes require confirmation; the last active
  admin cannot be removed or suspended. Microsoft IDs are read-only details,
  not everyday form fields.
- `/workspace/invitations`: enter a work email and optional name to prepare a
  message and copy the workspace link. Automatic email delivery is **not**
  connected. Opening an email app (only for a nonlocal configured address)
  prepares a draft; the administrator sends it manually. No invitation record,
  delivery claim or membership is created by preparing a message. Recipients
  sign in and request access, then an admin approves the verified identity as
  staff. An email address/link alone never grants access or an admin role.
- `/workspace/settings`: read-only connection/security status plus links to
  membership and invitations. There are no cosmetic save controls or unsecured
  settings changes.
- `/workspace/announcements`: searchable published updates, private drafts and
  archives. All ACTIVE staff can create, publish, edit and archive their own
  updates. Drafts/archives are visible only to their author and administrators.
  Admins can edit/moderate any update, pin posts and open/close discussions. An
  admin-moderated archive requires an admin to restore it; its author cannot
  bypass moderation. Published open discussions accept comments from all ACTIVE
  staff. Authors can remove their own comments; admins can remove any comment.
  Removal hides the body from the page/API while preserving the database record.
- `/workspace/documents`: folders, text search, own-upload/archive views and
  permission-checked PDF preview/download. All ACTIVE staff share immediately.
  Uploaders can archive/restore their own files; administrators moderate any file.
  Admin-moderated archives cannot be restored by the uploader. Files are limited
  to 3 MiB / 200 pages, with an 800 MiB conservative workspace reservation cap.
  This first release is for general resources only: no confidential case or HR
  files. Structural PDF checks are NOT antivirus scanning. See DOCUMENTS.md.

Administration pages independently check fresh database-active administrator status;
navigation visibility is not the authorization boundary. The membership API
also rechecks authorization inside the SQL transaction. Announcement operations
recheck ACTIVE membership and ownership under the shared access-control lock.
The document backend is implemented; upload controls fail closed unless a PRIVATE
Vercel Blob store is connected. Directory profiles remain **not connected** and
are labelled accordingly. No real staff invitations
or access changes were made while testing the redesign.

The interface uses labelled controls, visible keyboard focus, a skip link,
native confirmation dialogs, readable text and responsive navigation. Local
invitation drafts warn that localhost links cannot be used by colleagues.

### Separate fictional demo

The demo has announcements, comments, search/filtering, a staff directory,
sample document selection, PDF.js preview with page navigation/zoom/search,
and a membership-management design. Admin sample actions include invite, admit,
role assignment and suspension. Staff sample views do not expose these controls.
Directory sample data includes only active fictional members.

ALL **demo** state is held in React memory and resets on reload. No emails are sent.
Files stay in the tab. Audience labels are illustrative, not access permissions.
The preview role switch is not authentication or a production security boundary.
Do not enter real staff information, HR documents or safeguarding case material.

Microsoft OIDC sign-in is now implemented with Better Auth's verified generic
Entra provider. A separate single-tenant app, **JDPI Staff Workspace**, has been
registered with client ID `80ceea92-5a36-4e3e-a73b-51742b72ce35`. The local Web
callback is `http://localhost:4330/api/auth/callback/microsoft`. A credential must
be entered privately into ignored `.env.local` before sign-in activates. See
[Microsoft setup](MICROSOFT-SETUP.md). Real Microsoft sign-in was verified locally
on 8 October 2026 after the private secret Value was corrected. The identity
session survived a refresh; sign-out cleared access, and a direct `/workspace`
visit then redirected to sign-in. Personal consent only; no tenant-wide grant.

The connection began as identity-only and has since gained durable sessions and
membership. Document files require the separately approved private Blob connection.
Nonmembers remain locked until admin approval. The proposed bootstrap-admin
email never grants permissions. Demo state remains isolated and fictional.

Neon PostgreSQL's Free plan was provisioned, the foundation migrations applied, and the
first admin approved explicitly. See [database setup](DATABASE-SETUP.md) for the
verified setup, admission and authorization rules, and production readiness
gates. Without a database connection, the locked setup behaviour remains.

`/preview` and `/api/preview-assets/*` require development mode, a loopback Host
and no Vercel environment. They return 404 in production, even if a role or
preview query parameter is supplied. `/workspace` redirects unauthenticated users
to sign-in and checks the verified identity server-side. Production builds expose
the real sign-in and membership routes, not the fictional demo portal. This
workspace now has a separately configured Vercel deployment. The owner confirmed
successful production Microsoft sign-in after entering the protected credentials.
See [deployment status](DEPLOYMENT.md) for release evidence and remaining gates.

## Hosting plan

The separate Vercel project is `jdpi-staff-workspace`, root directory
`staff-workspace`, Next.js preset, `npm ci` install and `npm run build`.
Production tracks `staff-workspace-backup`, not the public website's `main`.
The approved domain is `staff.jdpimaiduguri.org`. Do not change
the WordPress/public-site domain, Sanity subdomain or mail DNS records.
Production organisation data will require PostgreSQL plus a PRIVATE Blob store
(or another approved private document store), not local deployment files.

Choose a suitable region and budget before provisioning paid services. Review
storage, bandwidth, restore plans and expected concurrent usage for ~210 staff.

## Connection and release checklist - still to implement

- Local registration, OIDC implementation and local sign-in/sign-out tests
  are complete. The approved production callback and protected configuration
  are connected, and the owner confirmed production sign-in. Ask
  before consequential access grants/admin consent; never put secrets in Git/chat.
- Signature, issuer, tenant, audience, expiry, state/nonce and PKCE are enforced.
  Only identity scopes are requested. Identity is tenant ID + object ID, not email.
- Microsoft sign-in is identity proof only. Every server action must check an
  ACTIVE database membership. Do not auto-admit based on email domain. Deny all
  membership changes except for ACTIVE ADMINS loaded from trusted server state.
- The approved first-admin bootstrap is complete as an explicit, audited,
  one-time operation;
  never continually elevate anyone whose email matches an environment variable.
- Only admins may invite/admit, revoke/suspend, and assign roles. New invitations
  default to staff unless explicitly changed by an admin. Record durable audit
  events and prevent accidental removal of the last active admin.
- The email-draft workflow does not provision Microsoft accounts or pre-admit
  staff. Configure and test automatic email delivery separately if required.
  Any future admission invitation must be single-use, expiring and securely bound
  to verified identity. Add MFA under JDPI tenant policy.
- All admitted staff can publish/comment. Server ownership/moderation checks,
  same-origin writes, bounded JSON/text, shared throttling, optimistic versions,
  duplicate request IDs and plain-text rendering are implemented and tested.
  Document upload permissions and private storage are now implemented separately.
- Document size/signature checks, bounded parsing, tenant/ownership checks,
  integrity verification and authenticated reads are implemented. Malware
  scanning, confidential audiences and a tested storage recovery process remain
  release gates for sensitive files and wider rollout. Never expose a public blob
  URL or use a public third-party document viewer.
- Private no-store headers and script-nonce CSP are implemented. Protect preview
  deployments as well as production before any staff data services are connected.
- Test active/pending/suspended users, admin/staff actions, role revocation, direct
  file access, guessed IDs, cross-tenant sign-in, session handling, load and backups.
- Real accounts, documents, invitation tokens and database dumps must never be
  committed. Keep environment placeholders only. Deploy after review and explicit
  approval; don't publish the local demo as a substitute for a private portal.

## Previous foundation verification - before Microsoft integration

- TypeScript check and both preview-policy unit tests passed.
- Next.js production build passed; the unchanged public Astro site also built
  all 35 pages successfully. Production dependency audit reported no known
  vulnerabilities at the time of the check.
- Tested the built production server on a separate loopback port: sign-in was
  unconnected with no demo links; `/preview?role=Admin`, the sample PDF and logo
  routes returned 404; `/workspace` redirected to sign-in.
- Browser checks passed for sample invitations, admission, role assignment,
  suspension and the sample access log. Staff views hid membership controls and
  denied the direct admin section. These checks are of the demo, not live auth.
- Staff sample publishing/commenting worked. PDF rendering, navigation, zoom,
  matching-page search, no-match feedback and phone-sized rendering worked.
  The two-page fictional PDF fixture was rendered and visually inspected.
- No real invitation, Microsoft access grant, Git push or Vercel deployment was
  performed during that earlier foundation check. Current connection status is
  described above; these earlier checks are historical, not current limitations.

## Sources used for the technical direction

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/vercel-blob/security
- https://learn.microsoft.com/en-us/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users
- https://mozilla.github.io/pdf.js/getting_started/
