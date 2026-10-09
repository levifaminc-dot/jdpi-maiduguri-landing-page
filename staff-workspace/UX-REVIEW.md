# Authenticated workspace UX review — 9 October 2026

This version updates the real Microsoft-authenticated workspace, not just the
fictional `/preview` design. The public Astro website and Sanity Studio are
unchanged. Prepared for local review; no GitHub push or staff deployment in this
version.

## What changed

- Admin Microsoft sign-in lands at `/workspace` with a dashboard, real membership
  counts, recent access events and clear links to the three admin pages.
- Members has readable status filters, name search, meaningful empty states,
  approval as staff, suspension/restoration and role management. Access changes
  use a native confirmation dialog with a cancel-first focus target. The only
  active administrator's suspension/demotion controls are not shown. SQL also
  independently enforces that protection.
- Invitations accepts a work email and optional name to prepare a message. There
  is no everyday object-ID input. The Microsoft identifier is retained behind
  read-only member details for identity disambiguation, not as an invitation task.
- Recipients still sign in and request access; admins explicitly approve the
  verified tenant/object identity as staff. Email addresses and shared links never
  confer authorization. No Graph permissions or automatic admission added.
- Automatic email delivery and sent-invitation tracking are not connected.
  Preparing a draft creates neither membership nor an invitation record. Local
  addresses are clearly labelled and the email-app action is unavailable locally.
- Settings displays current security/setup status honestly; no nonfunctional
  settings toggles or save buttons. Announcements, private document storage and
  directory profiles remain unconnected and are labelled accordingly.
- Responsive JDPI-branded shell, visible keyboard focus, skip link, labelled
  forms, readable text and accessible touch targets.

## Verified

- `npm run check` passed.
- `npm test`: all 21 tests passed, including durable session revocation, SQL role
  checks, last-admin protection, cross-tenant rejection and the new UI helpers.
- `npm run build` passed for all new dynamic routes.
- Real existing administrator Microsoft sign-in reached the dashboard.
- Dashboard, Members, Invitations and Settings navigation worked.
- Member name search, clear-search, request filter and empty states worked.
- A fictional `example.invalid` email produced a local invitation message with
  no email-app/send action, no database mutation and the correct warning.
- All four admin pages were inspected at a 320px browser viewport (305px usable
  width with scrollbar). Document width matched scroll width: no sideways scroll.
- Phone-size member navigation and filter controls measured at least 44px tall.
- The backup branch was visibly verified on GitHub at the existing recovery
  commit `14ad436`; this local UX revision has not been pushed onto that branch.

No real invitations, admissions, suspension, role changes, consent expansion or
new services were performed during these checks. Existing SQL integration tests
use fictional identities in an isolated PGlite database. The new confirmation
dialog was implemented, but no real access-change button was exercised against
Neon; those transitions are covered by the SQL tests.

Screenshots are retained outside the repository under the task's `outputs`
directory: `staff-workspace-admin-dashboard.jpg` and
`staff-workspace-ux-mobile.jpg`. Secrets remain in ignored local configuration.
