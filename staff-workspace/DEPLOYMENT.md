# Staff workspace deployment record

## Verified foundation — 9 October 2026

- Private GitHub repository: `levifaminc-dot/jdpi-maiduguri-landing-page`.
- Staff production branch: `staff-workspace-backup`.
- Initial deployed application commit: `298101e94deb9f92c9e5ccaecd580801e1bf9096`.
- Separate Vercel project: `jdpi/jdpi-staff-workspace`.
- Root directory: `staff-workspace`; preset: Next.js.
- Install: `npm ci`; build: `npm run build`.
- Initial production deployment: `8qGrB63EzoD7wrp6vHG4UBwTHwpF`, Ready.
- Provider alias: https://jdpi-staff-workspace.vercel.app/
- Approved custom domain: https://staff.jdpimaiduguri.org/
- Production branch tracking was explicitly changed from `main` to
  `staff-workspace-backup`. Future staff releases must target that branch.
- Public website and Sanity Studio projects were not reconfigured.

No environment variables or production credentials were uploaded. Microsoft
sign-in is disabled; the hosted app cannot access Neon or staff records.
The live sign-in page has no fictional demo links. `/preview` and
`/api/preview-assets/logo` returned 404. Unauthenticated workspace requests
redirected, and the sign-in response had private/no-store and frame-denial headers.
These checks verify the locked foundation, not production authentication.

## Domain

Vercel provided this record for the staff project:

| Type | Namecheap host | Target | TTL |
| --- | --- | --- | --- |
| CNAME | staff | 1dccde642f146577.vercel-dns-017.com | Automatic |

The owner confirmed adding it on 9 October 2026. Vercel then reported **Valid
Configuration**, and the custom-domain HTTPS sign-in page was verified with
online login still disabled. Never change the
root website, `www`, `studio`, MX, SPF, DKIM or DMARC records for this setup.

## Next steps requiring protected configuration

1. Verify custom-domain DNS and HTTPS in Vercel.
2. Obtain explicit approval for a separate least-privilege Neon runtime role.
   Do not deploy the existing database owner or migration credentials. Verify
   runtime privileges deny schema creation, role management, migration writes,
   audit modification/deletion and membership deletion.
3. With action-time approval, add this **Web** redirect URI to the existing
   single-tenant JDPI Staff Workspace Entra app:
   `https://staff.jdpimaiduguri.org/api/auth/callback/microsoft`.
   Retain the local callback; do not expand scopes or grant tenant-wide consent.
4. The owner privately adds the following to the staff project's **Production**
   environment only. Never paste secrets into chat, screenshots or Git.

   - `MICROSOFT_TENANT_ID`: the existing JDPI tenant ID.
   - `MICROSOFT_CLIENT_ID`: the existing JDPI Staff Workspace app ID.
   - `MICROSOFT_CLIENT_SECRET`: an approved private secret Value.
   - `BETTER_AUTH_SECRET`: a strong private application signing secret.
   - `BETTER_AUTH_URL`: `https://staff.jdpimaiduguri.org`.
   - `DATABASE_URL`: the pooled URL for the verified limited runtime role.

   Never add `DATABASE_MIGRATION_URL` to Vercel. Do not connect preview deployments
   to the production database. Private storage is not connected; no Blob
   credential is needed yet.
5. Redeploy the staff branch. Test the existing approved first administrator,
   logout, unauthenticated requests and a user-approved restricted pilot.
   Do not automatically admit staff or run the first-admin bootstrap again.

## Release limits

The team was on Vercel Hobby when this unconnected foundation was deployed.
Confirm plan eligibility and budget before organisational production use; no paid
upgrade or trial was approved or activated. Vercel describes Hobby as personal,
non-commercial use: https://vercel.com/docs/plans/hobby.

Announcements/comments, private documents, directory profiles and automatic
invitation emails are not connected. The hosted foundation is not a completed
210-person staff portal. Backup/restore, access-revocation, security and expected
concurrency checks remain release gates; see `DATABASE-SETUP.md` and `RECOVERY.md`.

## Safe release / recovery

Push reviewed staff changes to `staff-workspace-backup`, not directly to the
public site's `main`. Check the staff project's deployment source branch, commit
and Ready status. Keep public website releases separate. GitHub contains source
and guides only, not staff data or secret recovery. Reuse the existing Neon
database and Entra app when restoring; do not duplicate them or re-bootstrap an
administrator.
