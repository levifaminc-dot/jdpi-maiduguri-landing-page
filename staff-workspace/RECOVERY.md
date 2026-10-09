# Staff workspace code recovery

The staff workspace is stored in the private repository
`levifaminc-dot/jdpi-maiduguri-landing-page`, on the backup branch
`staff-workspace-backup`. Application source is in `staff-workspace/`; the
earlier fictional design preview is in `staff-preview/`. The branch preserves
the commit history without updating the public website's production `main`.
This is a source-code backup, not a database or credential backup. A separate,
credential-free Vercel foundation now tracks this branch; see `DEPLOYMENT.md`.

## Restore on another computer

1. Sign in to the authorised GitHub account and clone the private repository.
   Check out `staff-workspace-backup`. Use Node 24.
2. In `staff-workspace/`, run `npm ci` using the committed lockfile.
3. Copy `.env.example` to a new, ignored `.env.local`. Obtain the current
   Microsoft app secret and Neon URLs securely from the authorised account
   owners. Never send them through chat or commit them. If an existing Microsoft
   secret cannot be retrieved, the authorised administrator must create a new
   secret and revoke the old one after replacement has been verified.
4. Set the Microsoft tenant/app IDs and the approved local callback origin.
   Use a strong private `BETTER_AUTH_SECRET`; replacing it invalidates old
   signed cookies. See `MICROSOFT-SETUP.md`.
5. Use the existing Neon project/database. Do not create a replacement database
   or bootstrap another first administrator. Existing membership and audit data
   are in Neon, not Git. `DATABASE-SETUP.md` records the applied migrations and
   administrator setup; changing this document never changes actual permissions.
6. Run `npm test`, `npm run build`, then `npm run dev` for the local preview at
   `http://localhost:4330`. Sign in with an already admitted JDPI identity.

## Separate recovery responsibilities

- GitHub: source code, dependency lockfile, migration files and setup guides.
- Neon: staff identities, sessions, membership and audit records. A tested
  database backup/restore process remains a release requirement; GitHub does
  not back up these records.
- Secrets: keep approved credentials in an organisation-controlled password
  manager or secure deployment settings, not this repository. No secret backup
  is created by pushing this branch.
- Documents: real private document storage is not connected yet; future files
  require their own retention and recovery process.

Do not deploy with the generated Neon owner role. Set up least-privilege runtime
credentials before release. Announcements/comments, private documents and staff
profiles still require backend implementation. A separate staff repository is
optional for future independent access/deployment; it is not required for this
code backup.
