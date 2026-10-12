# Staff directory — local import/design preview

The first directory preview lives at `/preview/directory`. It is separate from
authenticated production pages and does not open the production membership database.
No account is admitted, invited, suspended or assigned a role by this feature.

Start the existing development server with `STAFF_DIRECTORY_PREVIEW_CSV` set to the
absolute path of a local Microsoft user-export CSV. Keep the source outside this
repository. Never commit the CSV or a generated staff list. The environment variable
contains a local path, not credentials, and must not be configured on Vercel.

The server checks development mode, absence of Vercel and an exact loopback Host
before reading the file. Production/hosted requests return 404. Data is read at
request time, not imported into a JavaScript bundle or copied into public assets.
The private source does not need to be moved or modified.

The local browser receives only preview identifiers, names, proposed JDPI work
addresses, job titles, departments, offices, work states and review flags. Microsoft object IDs,
personal phones/addresses, licences, password dates and other account fields are
omitted. Display names containing an email address are replaced with a review label.

Candidates are import candidates, not verified employees or approved workspace
members. Guest-pattern and explicit Guest-type accounts are excluded before browser
serialisation in every scope (including the tagging preview). This does not delete
Microsoft accounts or modify the CSV. Blocked, duplicate, missing-name and invalid-identity
records require review. Shared/service accounts require human review even if no
automated flag exists. A Microsoft sign-in address is only a proposed email contact.

Search, filters, card/list views, pagination and profile dialogs are interactive.
Edits affect this browser view only and disappear on reload; they do not write to
Microsoft, the CSV, the application database, localStorage or any remote service.
No birthday or photo upload feature is connected in this preview.

The role selector is a clearly labelled fictional permission simulation, not a
real role grant or production authentication. The separate “My profile” sample
does not add an account to the imported candidate list. Staff can edit its optional
private phone, private home address and introduction. Colleague contact is email-only:
there is no phone-sharing control, and even a legacy opt-in cannot expose a phone
number in another person's profile view.
Admin/profile-editor previews can edit professional profiles and confirmed work
state. Home addresses are
omitted from every nonowner view, including admin/editor views. Other staff cannot
edit a colleague's profile; staff cannot edit department or professional identity.

`profile-policy.mjs` contains bounded field/ownership/privacy policy primitives
with fictional tests. These are not yet connected to server-side production
authentication or durable storage. No real person has been assigned Editor access.
Production must resolve profile-editor capability independently from membership
administration, and never accept it from the client or the preview role selector.
Adding home-address storage also requires reviewed private storage, retention and
database grants; no home addresses from the source CSV are imported or displayed.

Department aliases are harmonised through `lib/directory-departments.mjs` at import
and preview-edit time, without rewriting the source CSV. The observed 28 labels
resolve to 17 departments. Case, spelling and known abbreviation variants share
filters and search results. Unknown new labels remain intact. Protection, MHPSS and
the combined Protection & MHPSS team remain separate, as do ALLRight, SILC and
Household Strengthening. Office names and job titles are unchanged.

Work-state filters include Borno, Yobe and Adamawa, plus unconfirmed locations.
`directory-states.mjs` maps unambiguous office locations, not residential CSV fields.
Generic Head/Head Office, Salama and Uba remain unset pending confirmation. Filtering
does not infer a person's home location. State edits require Admin/profile-editor
capability; ordinary staff cannot edit this professional field.

The separate tagging example below the directory supports an announcement and an
already-uploaded-PDF scenario, name search, removable selection chips and a maximum
of ten colleagues. It uses import candidates solely for design review, not proof
of access authority. PDF examples include selected colleagues/departments and an
explicit all-staff audience; announcement drafts remain private. It is not proof
of active membership. Saving changes browser memory only. No file upload, email,
notification, access grant or remote write takes place. See STAFF-TAGGING.md for
the separately staged, disabled-by-default authenticated implementation.

## Before production implementation

- Confirm the employee list and professional department/office vocabulary.
- Store profiles separately from membership authority; imports must not admit users.
- Bind imported identities server-side to the existing verified tenant/object ID.
- Require fresh active membership for every directory page/API request.
- Join visibility against ACTIVE membership; exclude pending, invited and suspended.
- Enforce Admin/profile-editor professional-field changes, administrator-only
  imports/membership changes and owner-only
  optional introduction edits, with bounded input, origin checks and auditing.
- Extend the restricted database role narrowly through reviewed migrations/grants.
- Test cross-user writes, role injection, revoked sessions, import replay, private
  caching and confidential-field exclusion before deployment.

No live import, database migration, permission expansion or deployment has been
performed for this preview.

The separate authenticated department-assignment page supports PDF audiences.
It reads ACTIVE workspace membership, not the CSV. It persists only the approved
department and delegated department-editor capability, not phones or home addresses.
The complete personal/professional directory remains a local design preview.
