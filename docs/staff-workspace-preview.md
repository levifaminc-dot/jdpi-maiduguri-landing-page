# JDPI staff workspace — local design prototype

This document describes the first vanilla preview, saved at commit `2a25235`.
The user subsequently selected Vercel. See `staff-workspace/README.md` for the
current Next.js preview and production-connection checklist.

Run `npm run staff:legacy-preview` from the repository root, then open
http://127.0.0.1:4330/. The separate preview uses built-in Node APIs and requires
no new dependencies. The public Astro build and Sanity Studio are unchanged.

## Scope

- Overview dashboard, announcement feed, categories, pinned/saved filters.
- All sample staff can compose announcements, comment, react and save posts.
- The current sample author can edit/remove their own announcement.
- Document title/folder search, clearly labelled sample TXT downloads, and
  local file selection (PDF, DOCX, XLSX, PPTX, TXT, CSV up to 5 MB).
- Sample authors can remove their own selected files.
- Six fictional directory profiles, department/office filters and global search.
- Responsive sidebar/navigation, native accessible dialogs, keyboard focus and
  live status feedback.

## Boundaries

This is NOT the production portal. It has no login, database, real invitations,
email delivery, department authorisation, admin console or durable storage.
Names, jobs, posts, emails, policies and documents are fictional. The figure 210
is the planned staff population, not a claim of 210 imported accounts.
No actual personnel or sensitive files should be entered.

State is held in tab memory only. Reloading or closing the tab clears every
change and locally selected file. There is no browser local/session storage,
no service worker, no analytics, no fetch/upload endpoint and no external CDN.
Audience labels are illustrative and NOT enforced permissions.

The server listens on loopback only, rejects non-local Host headers and serves
an explicit allowlist of UI assets and three fictional TXT downloads. It must not be exposed publicly or used as a
production server. It sends noindex headers and a restrictive CSP. This folder
is outside Astro's `src/pages` and `public`, so public Vercel builds do not
publish it. No public navigation points here.

## Production direction (not implemented)

The user owns Namecheap Stellar Plus. Laravel + MariaDB is the proposed app
stack, subject to hosting-policy confirmation, PHP/extensions checks, existing
account-load assessment and load tests before inviting approximately 210 staff.
Use external private document storage, backend permission checks, an invitation
workflow, admin MFA, moderation, approved work-directory fields, independent
backups and tested restore/revocation procedures. Keep HR/safeguarding case
records outside the general document library unless separately designed and
approved. Leave public Astro/Sanity hosting and email DNS intact.

This iteration is local-only. Do not push or deploy until the user approves the
preview. Preserve the code in Git separately from any future real staff data.

## Verification for this iteration

- `npm run staff:check`: server allowlist, download response, no-store/noindex,
  external connection restrictions, local Host checks and blocked writes pass.
- Browser checks: compose/edit announcement, add a comment, safely render
  HTML-like comment text as plain text, save/filter updates, office-filter and
  profile dialog, global search, document search and sample-file selection pass.
- Direct sample TXT download confirmed in the browser.
- 390px mobile dashboard inspected. Document tables scroll within their own
  container rather than widening the page. Desktop viewport restored afterward.
- Public Astro production build passes and emits 35 pages, none for the preview.
