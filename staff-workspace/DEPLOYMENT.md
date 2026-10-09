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

### Completed protected setup — 9 October 2026

The owner separately approved the production callback and limited runtime role.
Microsoft now lists both the original local Web callback and the approved staff
domain callback. No API scopes or tenant-wide consent were changed.

`jdpi_workspace_runtime` was created through the direct operator connection, not
Neon's console role-creation shortcut. It remains **NOLOGIN**, without a password,
until the owner completes the credential handoff. Effective database privileges
were checked, including inherited/PUBLIC privileges. It has no administrative
attributes, role memberships or object ownership; no permanent-schema creation,
migration access, member deletion, or audit update/delete/truncate is permitted.
Membership insertion excludes role assignment; member identity keys are not
updateable. Audits allow append-only specified columns. Local fixture tests also
exercise the required row-lock grants. A real runtime login remains untested.

Provisioning initially rolled back when the operator was not permitted to
impersonate the new role. No operator membership was widened to bypass that:
effective permissions were verified without impersonation, and only the later
successful transaction committed the role and its explicit grants. No staff
records or existing PUBLIC/database-owner privileges were changed.

Operator tool: `scripts/provision-runtime-role.mjs`; running without flags is
plan-only. `--apply` needs explicit owner approval and refuses to overwrite an
existing role. `--check` verifies current privileges without changing them.
Neither generates, logs or uploads a password. Do not run these operator tools
in deployment builds or through a public route.

### First-password handoff correction

Neon's console rejected Reset password for the passwordless SQL-created role:
`cannot update password for role without password`. Do not retry that action,
delete the role or replace it with an owner-privileged console-created account.

The owner can instead run `scripts/initialise-runtime-password.mjs` in a local
interactive terminal with the ignored `.env.local` loaded. It requires explicit
`INITIALISE` confirmation and two hidden password entries. It sends the original
password to Neon over certificate-verified TLS, as required by Neon's role API;
precomputed SCRAM verifiers are not supported. It changes only the existing
runtime role's LOGIN/password. Existing limited grants are rechecked, not broadened.
The private pooled connection is saved once in ignored `.env.runtime.local`;
the existing `.env.local` is not overwritten. It then tests TLS runtime login,
effective privileges and the required authorisation row lock without staff writes.
The assistant has NOT run this credential-creation command. Only fictional
fixture tests have exercised the SQL escaping; activation still awaits the owner
handoff.

Never paste that private file, password, verifier or connection URL into chat,
Git or a screenshot. `DATABASE_MIGRATION_URL` must never be uploaded to Vercel.

The owner subsequently reported completion, but read-only verification found
the role still NOLOGIN and `.env.runtime.local` absent. A Windows console test
reproduced `setRawMode EPERM` when closing the confirmation reader and reopening
a hidden password reader. The helper now keeps one protected console reader for
all three prompts. A Windows terminal test completed both fictional hidden
entries without printing them, and a stream test checks single raw-mode ownership
and no secret echo. Safe progress/stage messages were added. Activation remains
an owner handoff; no password was set by these diagnostic tests.

After a first-entry validation failure, the prompt now explains the length or
character requirement using fixed messages, without displaying any input. Invalid
or mismatched entries can be retried before connecting to the database. Ctrl+C
aborts outstanding hidden questions safely. The 24–128 printable-ASCII/no-space
requirement and limited role permissions were not weakened.

### Saved-but-unactivated recovery

The owner reached activation, but the transaction rolled back after saving the
private recovery file. Read-only verification still found runtime login disabled.
The operator had role-management permission and direct ADMIN OPTION. Diagnostic
transactions using fictional data accepted LOGIN, SCRAM-password assignment and
the exact combined operation plus effective-grant checks; ALL were rolled back.
Those rollback-only probes did not exercise Neon's commit-time role integration.
No real password was read by those diagnostic tests.

The owner can run `npm run db:resume-runtime` and confirm `RESUME`. This reads the
existing private recovery file locally, validates the runtime role and existing
Neon branch, and does not overwrite the file or request another password. It
activates only an inactive role. An already-active role is tested without changing
its credential. It then verifies the runtime connection and row lock. Error
codes and separate activation/verification/commit stages are safe to share; error
messages, URLs, passwords and verifiers are never printed. Do not upload the
recovery file until the command explicitly confirms successful verification.

### Neon commit-time incompatibility correction

The owner's resume attempt returned `XX000` at `commit-activation`. Neon's
official documentation states that role passwords must be supplied in original
form; hashed passwords are unsupported:
https://neon.com/docs/manage/roles#manage-roles-with-sql.
The previous helper incorrectly assumed PostgreSQL's acceptance of precomputed
SCRAM hashes also applied to Neon. PostgreSQL accepted it within the transaction,
but rollback-only diagnostics skipped the commit-time integration.

The corrected owner-run helper reuses the existing private recovery password,
sends it only over verified hosted TLS, and uses a tested escaped E-string for
the fixed role. The SQL is constructed in process memory, not a shell argument,
SQL editor or shell-history entry. It is never printed, nor are provider error
messages/details. Provider-side handling/diagnostic logging is controlled by
Neon; this command cannot guarantee removal from provider logs. Do not run it
through an assistant tool, query logger, traced shell or recorded terminal.
Role grants and staff data remain unchanged. The diagnostic tool is now strictly
read-only; it does not read the recovery file or attempt password changes.

Run the same `npm run db:resume-runtime` owner handoff, confirm `RESUME`, and wait
for the explicit TLS/runtime privilege and row-lock verification success before
using the credential for deployment. This correction is fixture-tested, not a
claim that production password activation has already succeeded.

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
