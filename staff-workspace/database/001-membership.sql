CREATE TABLE workspace_control (id integer PRIMARY KEY CHECK (id = 1));
INSERT INTO workspace_control VALUES (1);
CREATE TABLE workspace_member (
  tenant_id uuid NOT NULL CHECK (tenant_id = '2b64e4e5-af74-4b92-baab-b3621aef964d'),
  object_id uuid NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 150),
  role text NOT NULL DEFAULT 'STAFF' CHECK (role IN ('STAFF','ADMIN')),
  status text NOT NULL CHECK (status IN ('PENDING','INVITED','ACTIVE','SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, object_id)
);
CREATE INDEX workspace_member_status ON workspace_member(status);
CREATE TABLE workspace_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- NULL only for explicit operator bootstrap, not a signed-in staff action.
  actor_object_id uuid,
  target_object_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- No application route updates/deletes audits; production DB privileges must
-- also deny UPDATE/DELETE on workspace_audit (see DATABASE-SETUP.md).
CREATE TABLE workspace_throttle (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL
);
