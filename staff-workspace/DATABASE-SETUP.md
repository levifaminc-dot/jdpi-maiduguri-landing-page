# Staff membership / Neon preparation — 9 October 2026

## Current state

Neon project `jdpi-staff-workspace` (`autumn-surf-32450889`) was created on
9 October 2026 in the signed-in Tayo organisation after user approval, on the
$0 Free plan. It uses AWS Frankfurt, PostgreSQL 18, database `jdpi_staff`, and
the default `production` branch (`br-cold-sun-b121i3ov`). Extra services were
left off; no paid upgrade was selected. Free-plan compute/network limits can
suspend service and storage limits can block writes; they do not incur automatic
paid overages. Capacity must be measured before release to all 210 staff.

The user saved the pooled runtime and direct migration URLs privately in ignored
`.env.local`. Both refer to `jdpi_staff` on the same Neon endpoint; both client
connections use TLS with a verified server certificate. The two prepared
migrations were applied successfully on 9 October. Microsoft sign-in now uses
durable Neon-backed sessions in the local application.

No membership request, admission or admin grant has been created. Tayo's verified
identity is stored, but staff content remains locked pending admission. A browser
safety check rejected submitting an access request without separate user approval;
the action was not retried or performed through another route. First-admin setup
still needs explicit approval. No Git push or Vercel staff deployment occurred.
The local setup uses the generated owner role; replace runtime access with a
least-privilege role before deploying or releasing the workspace.

Prepared code includes durable database authentication, access requests,
admin-only admission/invitations/role changes/suspension/restoration, audit events,
shared rate limits and last-admin protection. All database checks run server-side.
The original fictional preview remains isolated from real membership.

## Connect after confirming the provider/account, region and plan

1. Sign in to the organisation-owned Neon account. Confirm project, region,
   plan/budget, retention and backup settings before provisioning anything.
   Use a separate staff-workspace database, not the public website CMS.
2. Save the pooled runtime URL privately as DATABASE_URL and the direct migration
   URL as DATABASE_MIGRATION_URL in ignored `.env.local`. Do not send URLs or
   passwords in chat. Do not use NEXT_PUBLIC_ variables.
3. Hosted connections must use `.neon.tech`; certificate verification is enforced.
   TLS URL parameters cannot disable certificate validation. A small pg pool is
   reused per process. Configure Vercel deployment region near the database.
4. `npm run db:plan` is offline and does not connect/write. Review the two SQL files.
   `npm run db:migrate` is an EXPLICIT write operation to the direct connection.
   It records checksums, serialises migrations and runs both in one transaction.
   It never executes during build/dev startup and creates no staff/admin records.
   Restart the app after the approved migration. Never modify applied SQL files;
   add a new migration for subsequent changes.
5. In database mode, previous stateless cookies do not grant staff access. Sign
   in again using Microsoft; sessions are durable with a fixed 15-minute lifetime,
   no cookie authorisation cache and no provider token retention. Membership is
   queried independently on every protected data request.

## First administrator: separate explicit approval required

The planned first administrator is tayo@jdpimaiduguri.org. That email is NOT an
authorisation rule. Nothing auto-promotes the first login or a matching address.

After connection, the intended administrator must sign in and request admission.
Verify the immutable tenant/user object ID against the approved Microsoft user.
Request explicit approval before granting the role. The operator-only script:

```
npm run db:bootstrap -- --object-id=<approved-microsoft-user-object-id>
```

is plan-only, with no database connection or changes. Actual execution requires
both `--apply` and `--confirm-admin=<the-same-object-id>` after approval. It requires
an existing verified database-auth user AND a pending request, refuses if any
admin exists, records the grant and revokes the identity's old sessions. The
person then signs in again. This script is never exposed through an HTTP route.

## Admission and invitations

- Staff can request access, but the request remains PENDING until an ACTIVE ADMIN
  admits them. Requests do not assign privileges. Suspended users cannot restore
  themselves by requesting again.
- An admin can pre-invite an exact JDPI Microsoft object ID as STAFF. Only that
  authenticated identity can accept; acceptance is one-time. This version does
  not send email or create Microsoft accounts. Admins share the workspace link
  directly. Email invitations with expiring tokens are a later integration.
- Promotion to ADMIN is a separate active-admin action. Client role fields and
  Microsoft role/email claims are never trusted for workspace authorisation.
- Every mutation rechecks the acting admin inside a serialised transaction. The
  last active admin cannot be demoted/suspended. Suspension or role change clears
  the target's durable sessions; subsequent requests require reauthentication.
- Restoration always gives STAFF, not a retained former ADMIN role. Access changes
  and admission decisions record actor, target, action and before/after state.

## Security / remaining release gates

- Runtime DB role must not be the Neon owner. Provision least-privilege app access
  separately from migration access: auth tables need auth-library CRUD; membership
  needs SELECT/INSERT/UPDATE; audit needs SELECT/INSERT and identity-sequence usage,
  never UPDATE/DELETE; throttle needs SELECT/INSERT/UPDATE. Do not expose the direct
  owner/migration URL to the deployed web app. Schema creation is operator-only.
- Foreign Host/Origin writes, invalid bodies, unverified identities and inactive
  admins are rejected. API responses are private/no-store. Raw DB/provider errors,
  SQL parameters and connection strings are not logged or sent to clients.
- Shared auth limits are database-backed. Membership requests/admin actions have
  a separate DB-backed per-identity limit. Plan scheduled cleanup of expired auth
  rows/counters and audit retention before release; it is not automated yet.
- Auth-session DB revocation and membership status are checked at the data layer.
  Future announcement/document/directory APIs MUST call the shared access helper
  and perform action-specific ownership/audience checks. UI hiding alone is not
  authorisation. Private files are NOT connected in this phase.
- Announcements/comments, directory profiles, private file storage, malware
  scanning, invitation email, backup/restore drills and load/concurrent-admin
  tests on hosted PostgreSQL remain pending. Do not admit all 210 staff or release
  private data until these gates are reviewed. Use fictional test users first.
- No Git push, Vercel deployment, org-wide Microsoft consent or real admin grant
  is included in this preparation step.

## Verification

Local PostgreSQL-engine tests (PGlite, fictional identities) verify migrations
against the pinned Better Auth schema, pending admission, one-time operator
bootstrap, invitation identity binding, role/suspension session deletion, last-
admin protection, suspended-user denial and shared throttling. A signed mock
OIDC exchange through the actual PostgreSQL auth adapter verifies persisted
sessions across auth-instance restart, token stripping and immediate session
revocation. These do not replace a live Neon integration/concurrency test.

On 9 October, all 15 automated tests and the production build passed. The Windows
sandbox denied Next's generated pg dependency junction; running the same build
and loopback preview with the required OS permission resolved that environment
issue without changing authentication or TLS protections. After provisioning,
both migrations were verified on hosted Neon and the 15 tests passed again.
Live Microsoft sign-in created one verified identity and one durable session;
provider token columns remained empty. Browser refresh retained the session.
Sign-out removed it (zero active sessions) and direct workspace navigation
redirected to sign-in. Membership and audit counts remained zero. Hosted
membership mutation, concurrent-admin, load and restore tests remain pending.

`pg_stat_ssl` through the pooled connection describes Neon's internal backend
link, not the application's TLS link to the pooler. Verification used the pg
client's live TLS socket: `encrypted=true`, `authorized=true` on both URLs;
certificate checking was never disabled.

References:
- https://better-auth.com/docs/adapters/postgresql
- https://better-auth.com/docs/concepts/database
- https://better-auth.com/docs/concepts/session-management
- https://neon.com/docs/connect/connection-pooling
- https://neon.com/docs/introduction/plans
- https://neon.com/blog/neon-free-plan-1-gb-per-project
