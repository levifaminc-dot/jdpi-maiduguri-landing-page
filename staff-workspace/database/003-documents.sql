-- Additive metadata only. PDF bytes belong exclusively in private Blob storage.
CREATE TABLE workspace_document (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL CHECK(tenant_id='2b64e4e5-af74-4b92-baab-b3621aef964d'),
  uploader_object_id uuid NOT NULL,
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK(length(description)<=1000),
  folder text NOT NULL CHECK(folder IN ('Policies & guidance','Templates & tools','Programme resources','Reports','Other')),
  filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 160),
  byte_size integer NOT NULL CHECK(byte_size BETWEEN 16 AND 3145728),
  page_count integer NOT NULL CHECK(page_count BETWEEN 1 AND 200),
  sha256 text NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),
  blob_path text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'UPLOADING' CHECK(status IN ('UPLOADING','READY','FAILED','ARCHIVED')),
  moderated boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(tenant_id,uploader_object_id) REFERENCES workspace_member(tenant_id,object_id)
);
CREATE INDEX workspace_document_library ON workspace_document(tenant_id,status,created_at DESC,id);
CREATE TABLE workspace_document_control (
  id integer PRIMARY KEY CHECK(id=1),
  reserved_bytes bigint NOT NULL DEFAULT 0 CHECK(reserved_bytes BETWEEN 0 AND 838860800)
);
INSERT INTO workspace_document_control(id) VALUES (1);
