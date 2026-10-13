-- Approved-member profiles only. No import, admissions or role assignments.
ALTER TABLE workspace_staff_profile
  ADD COLUMN display_name text NOT NULL DEFAULT '' CHECK(length(display_name)<=160),
  ADD COLUMN work_email text NOT NULL DEFAULT '' CHECK(length(work_email)<=254),
  ADD COLUMN job_title text NOT NULL DEFAULT '' CHECK(length(job_title)<=160),
  ADD COLUMN office text NOT NULL DEFAULT '' CHECK(length(office)<=160),
  ADD COLUMN work_state text NOT NULL DEFAULT '' CHECK(work_state IN ('','Borno','Yobe','Adamawa')),
  ADD COLUMN introduction text NOT NULL DEFAULT '' CHECK(length(introduction)<=600);
-- Personal fields never participate in directory listing queries.
CREATE TABLE workspace_staff_private_profile (
  tenant_id uuid NOT NULL CHECK(tenant_id='2b64e4e5-af74-4b92-baab-b3621aef964d'),
  object_id uuid NOT NULL,
  phone text NOT NULL DEFAULT '' CHECK(length(phone)<=40),
  home_address text NOT NULL DEFAULT '' CHECK(length(home_address)<=500),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,object_id),
  FOREIGN KEY(tenant_id,object_id) REFERENCES workspace_member(tenant_id,object_id)
);
