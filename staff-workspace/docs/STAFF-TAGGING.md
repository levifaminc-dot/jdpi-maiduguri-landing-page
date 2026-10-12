# Staff tagging — staged, not activated

Announcement tags identify relevant colleagues; drafts remain private. PDF tags
grant read/preview/download access to approved colleagues, together with selected
department audiences. Uploaders/admins retain access. Tags do not grant editing,
membership, publishing or moderation privileges.
It does not send email or create a task. Colleague communication remains email-only.

## Local review

At `/preview/directory`, the final section demonstrates selection by name, removal
and up to ten recipients. Source import candidates are not verified workspace
members. This section is browser-memory only and cannot run in production.

## Authenticated implementation

`StaffTags.tsx` appears on saved announcement detail pages and document cards only
when server-side `STAFF_TAGGING_ENABLED` is exactly `true`. Defaults remain disabled.
The authenticated `/api/staff-tags` route also checks this flag. No environment file
or Vercel setting has been changed for activation.

- The name picker reads fresh ACTIVE membership, not the CSV, Graph or a client role.
  It returns names and stable selection IDs, not email, phone or private addresses.
- Only an announcement's author, a PDF's uploader or an ACTIVE Admin can replace tags.
  Moderation locks and archived/incomplete states prevent edits.
- Private announcement drafts and archives retain owner/Admin visibility. PDF
  archives remain uploader/Admin-only. A READY PDF can be read only by its uploader,
  an Admin, a tagged ACTIVE colleague, an ACTIVE colleague whose approved department
  is selected, or any ACTIVE colleague if ALL_STAFF was explicitly chosen.
- Uploads default to SELECTED with no audience: uploader/Admin-only. Audience
  metadata and tags are saved transactionally before a PDF is published. Listings,
  tags metadata and direct PDF delivery all enforce the same audience checks.
- Changing tags/departments revokes that grant immediately. Another independently
  valid tag/department/ALL_STAFF grant can still permit access. File reads lock the
  resource, and department changes take the membership-control exclusive lock.
- Recipients must still be ACTIVE when saving. Suspended recipients are excluded
  from displayed labels and cannot be added again while suspended.
- At most ten unique UUID recipients; fixed resource types; strict input allowlist;
  bounded JSON; same-origin/host checks; authenticated identity; private no-store.
- Changes use a transaction, shared membership lock, resource row lock, version
  conflict protection, database throttling and a count/ID-only audit event.
- No email addresses or full content are placed in audit details.

## Before deployment

1. Review/apply `005-staff-tags.sql` and `006-document-audiences.sql` with the migration tool.
   It adds two tag tables and narrowly scoped SELECT, INSERT and tag-only DELETE
   privileges plus audience-column/profile-table grants to the limited runtime role.
   Existing PDFs default to uploader/Admin-only until an audience is chosen. No
   staff are admitted or assigned editors. `db:plan` is read-only; `db:migrate` writes.
2. Verify base, tag and audience effective runtime grants. On a fresh install where
   the runtime role is created after migrations, explicitly apply `staffTagGrantsSql`
   and `documentAudienceGrantsSql`, then verify both as part of provisioning.
3. Confirm the approved membership list. Microsoft guests are excluded from this
   directory import, but CSV exclusion alone cannot revoke a separately admitted
   live membership. Never use this preview to infer employment or grant access.
4. Enable the server flag only after the database migration/grants and deployment
   review. Do not copy the CSV or preview source path to Vercel.
5. Use `/workspace/departments` for approved department assignments. Admins can
   delegate the profile-editor capability; editors can set departments but cannot
   assign editors, admit/suspend staff or change membership roles. Because departments
   affect file access, only verified work assignments should be entered. No export
   has been imported; profiles begin unassigned.
6. Test chosen-recipient vs unrelated staff file listing/direct download; test
   department reassignment, tag removal, explicit ALL_STAFF and archival. Verify that
   tags never expose announcement drafts or create management privileges.

Automated database tests use fictional records in an in-memory database. Production
activation is a separate approved operator step, never part of a build.
