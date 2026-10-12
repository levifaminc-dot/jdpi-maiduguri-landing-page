-- Existing PDFs become uploader/admin-only until an audience is chosen.
-- No staff are admitted; professional profiles start empty.
ALTER TABLE workspace_document ADD COLUMN sharing_mode text NOT NULL DEFAULT 'SELECTED' CHECK(sharing_mode IN ('SELECTED','ALL_STAFF'));
ALTER TABLE workspace_document ADD COLUMN sharing_departments text[] NOT NULL DEFAULT '{}';
CREATE TABLE workspace_staff_profile (
  tenant_id uuid NOT NULL CHECK(tenant_id='2b64e4e5-af74-4b92-baab-b3621aef964d'),
  object_id uuid NOT NULL,
  department text NOT NULL DEFAULT '' CHECK(length(department)<=160),
  profile_editor boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,object_id),
  FOREIGN KEY(tenant_id,object_id) REFERENCES workspace_member(tenant_id,object_id)
);
