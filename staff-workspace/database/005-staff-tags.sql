-- Additive relevance metadata only. No staff admission or access grants.
CREATE TABLE workspace_announcement_tag (
  tenant_id uuid NOT NULL CHECK(tenant_id='2b64e4e5-af74-4b92-baab-b3621aef964d'),
  resource_id uuid NOT NULL REFERENCES workspace_announcement(id),
  staff_object_id uuid NOT NULL,
  tagged_by_object_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,resource_id,staff_object_id),
  FOREIGN KEY(tenant_id,staff_object_id) REFERENCES workspace_member(tenant_id,object_id),
  FOREIGN KEY(tenant_id,tagged_by_object_id) REFERENCES workspace_member(tenant_id,object_id)
);
CREATE TABLE workspace_document_tag (
  tenant_id uuid NOT NULL CHECK(tenant_id='2b64e4e5-af74-4b92-baab-b3621aef964d'),
  resource_id uuid NOT NULL REFERENCES workspace_document(id),
  staff_object_id uuid NOT NULL,
  tagged_by_object_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,resource_id,staff_object_id),
  FOREIGN KEY(tenant_id,staff_object_id) REFERENCES workspace_member(tenant_id,object_id),
  FOREIGN KEY(tenant_id,tagged_by_object_id) REFERENCES workspace_member(tenant_id,object_id)
);
CREATE INDEX workspace_announcement_tag_staff ON workspace_announcement_tag(tenant_id,staff_object_id,resource_id);
CREATE INDEX workspace_document_tag_staff ON workspace_document_tag(tenant_id,staff_object_id,resource_id);
