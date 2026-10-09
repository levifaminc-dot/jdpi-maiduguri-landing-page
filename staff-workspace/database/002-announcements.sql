-- Additive only: no existing staff, sessions, membership or audit rows change.
CREATE TABLE workspace_announcement (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL CHECK (tenant_id = '2b64e4e5-af74-4b92-baab-b3621aef964d'),
  author_object_id uuid NOT NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 180),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 12000),
  category text NOT NULL CHECK (category IN ('General','People','Operations','Field updates')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  pinned boolean NOT NULL DEFAULT false,
  moderated boolean NOT NULL DEFAULT false,
  comments_enabled boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE(tenant_id,id),
  FOREIGN KEY(tenant_id,author_object_id) REFERENCES workspace_member(tenant_id,object_id)
);
CREATE INDEX workspace_announcement_feed ON workspace_announcement(tenant_id,status,pinned DESC,published_at DESC,id);
CREATE TABLE workspace_comment (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL CHECK (tenant_id = '2b64e4e5-af74-4b92-baab-b3621aef964d'),
  announcement_id uuid NOT NULL,
  author_object_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  hidden_at timestamptz,
  hidden_by_object_id uuid,
  FOREIGN KEY(tenant_id,announcement_id) REFERENCES workspace_announcement(tenant_id,id),
  FOREIGN KEY(tenant_id,author_object_id) REFERENCES workspace_member(tenant_id,object_id),
  FOREIGN KEY(tenant_id,hidden_by_object_id) REFERENCES workspace_member(tenant_id,object_id)
);
CREATE INDEX workspace_comment_thread ON workspace_comment(announcement_id,created_at,id);
