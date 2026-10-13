# Approved-member staff directory

`/workspace/directory` uses fresh ACTIVE membership and stored professional profiles,
not the Microsoft export. Pending, invited and suspended accounts are excluded.
Migration 007 adds fields without importing/admitting/promoting any account.
Existing department assignments and delegated profile editors are preserved.

Staff can save their own introduction and optional personal phone/home address.
Administrators and active profile editors may edit work display name, JDPI work
contact email, title, office, department, work state and introductions. Editing
contact details never changes sign-in identity or membership. Only administrators
can delegate profile-editor access through the existing Departments page.
Department edits affect PDF audiences and use the same membership-control lock.

Private fields are stored separately, fetched only for the requesting owner, never
selected for directory feeds or another viewer (including admins/editors), and
never included in audit details, public assets or browser storage. APIs use
no-store responses, verified sessions, same-origin POST, bounded JSON, strict
field allowlists, version conflicts and database-backed write throttling.
Members can clear private values by saving empty fields. Suspension hides profiles
and blocks reads/writes but is not record deletion. Database operators and backups
remain privileged; this is workspace-level privacy, not end-to-end encryption.
JDPI should apply its staff-data retention policy to privileged database backups.

Deploy migration 007 with the private migration connection, verify base/tag/audience
and directory grants, then deploy the staff branch. No new secret or Graph scope
is required. Production builds must not run migrations or import the CSV.
The original `/preview/directory` remains localhost-only and is not a live import.

Assign confirmed work details in each colleague's profile. Work states are Borno,
Yobe or Adamawa (or unconfirmed); residential addresses never determine work state.
Colleague contact is email only. Photos, birthdays and task management are not
included in this release.
