# JDPI staff workspace - Vercel foundation and local preview

This separate Next.js project replaces the proposed Laravel/Namecheap direction.
It does not replace the Astro public website or the Sanity Studio. No staff data
is stored in the marketing CMS. The original vanilla preview is retained in
`../staff-preview` as a recovery version.

## Run locally

1. `npm ci` within this folder.
2. `npm run dev` (or `npm run staff:preview` from the repository root).
3. Open http://127.0.0.1:4330/ for the sign-in design.
4. Use **Explore as staff** or **Explore as admin**. These are DEMO views only.

`npm run check`, `npm test` and `npm run build` verify the foundation. Dependencies
are pinned in this project's independent package-lock. The PDF worker and fonts
are prepared from the installed dependency before dev/build, not an external CDN.

## Current capabilities and limits

The demo has announcements, comments, search/filtering, a staff directory,
sample document selection, PDF.js preview with page navigation/zoom/search,
and a membership-management design. Admin sample actions include invite, admit,
role assignment and suspension. Staff sample views do not expose these controls.
Directory sample data includes only active fictional members.

ALL state is held in React memory and resets on reload. No emails are sent.
Files stay in the tab. Audience labels are illustrative, not access permissions.
The preview role switch is not authentication or a production security boundary.
Do not enter real staff information, HR documents or safeguarding case material.

The Microsoft button is disabled intentionally. The organisation tenant ID and
requested initial admin have been supplied locally but are not credentials and
do not connect an account or grant access. No app registration, client secret,
database, private Blob store, authentication callback or real membership API is
implemented or provisioned in this iteration. Adding environment values alone
will NOT activate them. No real user has been invited or admitted.

`/preview` and `/api/preview-assets/*` require development mode, a loopback Host
and no Vercel environment. They return 404 in production, even if a role or
preview query parameter is supplied. `/workspace` redirects to the sign-in page
until authentication is implemented. Production builds therefore expose only an
unconnected sign-in/setup screen, not the demo portal. No push/deploy this turn.

## Hosting plan

Use a separate Vercel project, root directory `staff-workspace`, Next.js preset,
`npm ci` install and `npm run build`. The intended domain is
`staff.jdpimaiduguri.org`, subject to final approval and DNS setup. Do not change
the WordPress/public-site domain, Sanity subdomain or mail DNS records.
Production organisation data will require PostgreSQL plus a PRIVATE Blob store
(or another approved private document store), not local deployment files.

Choose a suitable region and budget before provisioning paid services. Review
storage, bandwidth, restore plans and expected concurrent usage for ~210 staff.

## Connection and release checklist - still to implement

- Register a single-tenant web application in JDPI's Entra tenant with approved
  permissions and callback URLs. Ask for confirmation before consequential access
  grants/admin consent. Enter the client secret only in protected local/Vercel
  settings; never put credentials in Git, browser-public variables or chat.
- Verify issuer, tenant, audience, state/nonce and token validity using a maintained
  OIDC library. Match users by immutable tenant ID + object ID, not just email.
- Microsoft sign-in is identity proof only. Every server action must check an
  ACTIVE database membership. Do not auto-admit based on email domain. Deny all
  membership changes except for ACTIVE ADMINS loaded from trusted server state.
- Bootstrap the approved first admin as an explicit, audited, one-time operation;
  never continually elevate anyone whose email matches an environment variable.
- Only admins may invite/admit, revoke/suspend, and assign roles. New invitations
  default to staff unless explicitly changed by an admin. Record durable audit
  events and prevent accidental removal of the last active admin.
- Invitations admit existing Microsoft identities; they are not Microsoft account
  provisioning. Design expiring, single-use invitation tokens and verified account
  matching. Configure and test email delivery. Add MFA under JDPI tenant policy.
- All admitted staff can publish/comment/upload. Check ownership/moderation rules
  on every request. Add CSRF protections, validation, rate limits and XSS tests.
- Private document uploads need server permission checks, size/type/signature
  validation, malware scanning/quarantine, tenant/audience metadata and permission-
  checked reads. Preview/download must share the same authorisation path. Never
  expose a public blob URL or use a public third-party document viewer.
- Avoid public/private-data caching. Tighten CSP with nonces when real auth is
  connected; protect preview deployments as well as production.
- Test active/pending/suspended users, admin/staff actions, role revocation, direct
  file access, guessed IDs, cross-tenant sign-in, session handling, load and backups.
- Real accounts, documents, invitation tokens and database dumps must never be
  committed. Keep environment placeholders only. Deploy after review and explicit
  approval; don't publish the local demo as a substitute for a private portal.

## Local verification - 8 October 2026

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
  performed. Authentication and all production data services remain unconnected.

## Sources used for the technical direction

- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/vercel-blob/security
- https://learn.microsoft.com/en-us/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users
- https://mozilla.github.io/pdf.js/getting_started/
