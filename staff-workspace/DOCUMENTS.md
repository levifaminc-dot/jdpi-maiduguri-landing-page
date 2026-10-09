# Private staff PDF library — 9 October 2026

## Scope and permissions

All database-ACTIVE staff may share general resources immediately; there is no
admin approval queue. Fresh membership is checked for listing, upload, moderation,
preview and download. The author comes from the verified Microsoft identity, not
a browser field. PDF bytes are never stored in Sanity or Git.

Uploaders manage their own archives. Administrators manage any document; an
admin-moderated archive can only be restored by an administrator. Other staff
cannot read archived PDFs. Archive is recoverable, not permanent file deletion.
Suspension prevents new reads, but cannot recall copies already downloaded.

## Storage and deployment

- Approved private Vercel Blob store: `jdpi-staff-private-pdfs`, Frankfurt FRA1,
  `store_m1upHAs8pdfFS05i`, in the JDPI Hobby team.
- Connected ONLY to `jdpi-staff-workspace` Production. No connection to website,
  Studio, Preview or Development. A sensitive server-side BLOB_READ_WRITE_TOKEN
  was created by Vercel's connection flow; its value was not read or copied.
- Metadata, checksums, upload state and quota reservations live in Neon.
  `003-documents.sql` adds tables and column-limited runtime grants. It leaves
  earlier migrations, memberships, passwords and old privileges unchanged.
- All reads use an authenticated app endpoint. The browser never receives a
  Blob URL/token. Same-origin writes, no-store responses and attachment downloads
  protect the file boundary; PDF.js previews fetch through the same permission
  path and render on the user's device, not a public document-viewing service.
- File validation runs in an isolated Node worker with an eight-second timeout
  and V8 heap limits. The worker plus pinned pdf-lib dependencies are explicitly
  included in the Next.js function trace. This is bounded parsing, not antivirus.

## Limits and failure behaviour

PDF only, maximum 3 MiB and 200 pages. The parser rejects encryption, scripting,
embedded files, remote/launch actions and unsupported complex/damaged PDFs. It
does not rewrite the original PDF or claim to detect every malicious payload.
Ordinary URI links are not activated by this canvas/text-only preview.

Upload attempts are database-throttled before parsing: three per minute and ten
per day per colleague. Invalid attempts count. A reservation cap of 800 MiB
includes archived, incomplete and potentially orphaned files; no automatic paid
upgrade is started. Hobby's provider-wide usage limits also apply to storage,
operations and transfer. Private serving consumes function resources as well.

Quota is reserved transactionally before storage writes. Publication rechecks
membership after storage completes. Failed/uncertain uploads stay private and
out of the staff feed. A failed commit acknowledgement does NOT trigger file
deletion, avoiding destruction of a successfully published file. Failed uploads
keep their quota reservation. Operator-only cleanup/reconciliation and retention
policy still need implementation; do not edit counts casually or delete files
without checking their metadata and explicit approval.

## Testing and remaining rollout gates

44 automated tests pass, including actual PDF parser workers and operations under
the limited PostgreSQL runtime role. Tests cover pending/suspended/wrong-tenant
denial, immediate publication, ownership, admin moderation, optimistic conflicts,
idempotence, integrity, quota limits and suspension during upload. Tests use only
fictional identities and memory-local files, not staff data.

Before use for confidential case/HR documents or organisation-wide rollout:

- Add antivirus scanning/quarantine and a defined rejected-file workflow.
- Introduce explicit confidential audiences, retention and deletion rules.
- Test independent database + Blob backup/recovery and cross-store consistency.
- Confirm Vercel plan eligibility, limits/budget and load for roughly 210 staff.
- Test more than one real staff account, concurrent operations and revocation.

The local fictional demo remains separate and disabled in production. Browser
checks and live pilot results are recorded in DEPLOYMENT.md; test fixtures alone
are not evidence of a successful production upload.

References: https://vercel.com/docs/vercel-blob/private-storage,
https://vercel.com/docs/vercel-blob/usage-and-pricing,
https://vercel.com/docs/vercel-blob/using-blob-sdk
