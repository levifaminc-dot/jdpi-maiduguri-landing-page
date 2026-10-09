// Operator-only provisioning; never imported by a request handler.
export const runtimeRole = 'jdpi_workspace_runtime';
export const createRuntimeRoleSql = `CREATE ROLE ${runtimeRole}
  NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`;
export const announcementGrantsSql = `
  GRANT SELECT ON public.workspace_announcement,public.workspace_comment TO ${runtimeRole};
  GRANT INSERT(id,tenant_id,author_object_id,title,body,category),
    UPDATE(title,body,category,status,pinned,moderated,comments_enabled,version,updated_at,published_at)
    ON public.workspace_announcement TO ${runtimeRole};
  GRANT INSERT(id,tenant_id,announcement_id,author_object_id,body),
    UPDATE(hidden_at,hidden_by_object_id) ON public.workspace_comment TO ${runtimeRole};`;
export const documentGrantsSql=`
  GRANT SELECT ON public.workspace_document,public.workspace_document_control TO ${runtimeRole};
  GRANT INSERT(id,tenant_id,uploader_object_id,title,description,folder,filename,byte_size,page_count,sha256,blob_path),
    UPDATE(status,moderated,version,updated_at) ON public.workspace_document TO ${runtimeRole};
  GRANT UPDATE(reserved_bytes) ON public.workspace_document_control TO ${runtimeRole};`;
export const documentStorageGrantsSql=`
  GRANT INSERT(storage_provider,storage_site_id,storage_drive_id)
    ON public.workspace_document TO ${runtimeRole};`;

export function runtimeGrantsSql(database) {
  if (!/^[a-z][a-z0-9_]*$/.test(database)) throw new Error('Invalid database name.');
  return `
    GRANT CONNECT ON DATABASE "${database}" TO ${runtimeRole};
    GRANT USAGE ON SCHEMA public TO ${runtimeRole};
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
      public."user", public."session", public.account, public.verification,
      public."rateLimit" TO ${runtimeRole};
    GRANT SELECT ON TABLE public.workspace_member TO ${runtimeRole};
    GRANT INSERT (tenant_id, object_id, name, status),
      UPDATE (name, role, status, updated_at)
      ON TABLE public.workspace_member TO ${runtimeRole};
    GRANT SELECT, UPDATE (id) ON TABLE public.workspace_control TO ${runtimeRole};
    GRANT SELECT ON TABLE public.workspace_audit TO ${runtimeRole};
    GRANT INSERT (actor_object_id, target_object_id, action, details)
      ON TABLE public.workspace_audit TO ${runtimeRole};
    GRANT USAGE ON SEQUENCE public.workspace_audit_id_seq TO ${runtimeRole};
    GRANT SELECT, INSERT, UPDATE ON TABLE public.workspace_throttle TO ${runtimeRole};
  ${announcementGrantsSql}
  ${documentGrantsSql}
  ${documentStorageGrantsSql}`;
}

// Checks effective grants, including PUBLIC and membership inheritance, not
// just this operator's GRANT statements. Nothing is globally revoked.
export async function verifyRuntimeRole(db) {
  const row = (await db.query(`SELECT oid, rolcanlogin, rolsuper, rolcreatedb,
    rolcreaterole, rolreplication, rolbypassrls
    FROM pg_roles WHERE rolname=$1`, [runtimeRole])).rows[0];
  if (!row || ['rolsuper','rolcreatedb','rolcreaterole','rolreplication','rolbypassrls'].some(k => row[k])) {
    throw new Error('Runtime role attributes are unsafe.');
  }
  const membership = (await db.query('SELECT count(*)::int AS count FROM pg_auth_members WHERE member=$1', [row.oid])).rows[0].count;
  if (membership) throw new Error('Runtime role has unexpected role memberships.');
  const ownership = (await db.query(`SELECT
    EXISTS(SELECT 1 FROM pg_class WHERE relowner=$1) OR
    EXISTS(SELECT 1 FROM pg_namespace WHERE nspowner=$1) OR
    EXISTS(SELECT 1 FROM pg_database WHERE datdba=$1) OR
    EXISTS(SELECT 1 FROM pg_proc WHERE proowner=$1) AS owns`, [row.oid])).rows[0].owns;
  if (ownership) throw new Error('Runtime role owns database objects.');
  const check = async (sql, params, expected) => {
    const value = (await db.query(sql, params)).rows[0].allowed;
    if (value !== expected) throw new Error('Runtime effective privilege check failed.');
  };
  await check("SELECT has_database_privilege($1,current_database(),'CONNECT') AS allowed", [runtimeRole], true);
  await check("SELECT has_database_privilege($1,current_database(),'CREATE') AS allowed", [runtimeRole], false);
  await check("SELECT has_schema_privilege($1,'public','USAGE') AS allowed", [runtimeRole], true);
  // Deny permanent schema creation anywhere in this database, not just public.
  await check(`SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE
    nspname !~ '^pg_temp_' AND nspname !~ '^pg_toast_temp_' AND
    has_schema_privilege($1,oid,'CREATE')) AS allowed`, [runtimeRole], false);
  for (const table of ['user','session','account','verification','rateLimit']) {
    for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
      await check('SELECT has_table_privilege($1,$2,$3) AS allowed', [runtimeRole, `public."${table}"`, privilege], true);
    }
  }
  for (const table of ['workspace_member','workspace_control','workspace_audit','workspace_throttle','workspace_announcement','workspace_comment','workspace_document','workspace_document_control']) {
    await check('SELECT has_table_privilege($1,$2,\'SELECT\') AS allowed', [runtimeRole, `public.${table}`], true);
    for (const privilege of ['DELETE','TRUNCATE','TRIGGER','REFERENCES']) {
      await check('SELECT has_table_privilege($1,$2,$3) AS allowed', [runtimeRole, `public.${table}`, privilege], false);
    }
  }
  for (const [table, column, privilege] of [
    ['workspace_control','id','UPDATE'],
    ...['tenant_id','object_id','name','status'].map(c => ['workspace_member',c,'INSERT']),
    ...['name','role','status','updated_at'].map(c => ['workspace_member',c,'UPDATE']),
    ...['actor_object_id','target_object_id','action','details'].map(c => ['workspace_audit',c,'INSERT']),
    ...['id','tenant_id','author_object_id','title','body','category'].map(c=>['workspace_announcement',c,'INSERT']),
    ...['title','body','category','status','pinned','moderated','comments_enabled','version','updated_at','published_at'].map(c=>['workspace_announcement',c,'UPDATE']),
    ...['id','tenant_id','announcement_id','author_object_id','body'].map(c=>['workspace_comment',c,'INSERT']),
    ...['hidden_at','hidden_by_object_id'].map(c=>['workspace_comment',c,'UPDATE']),
    ...['id','tenant_id','uploader_object_id','title','description','folder','filename','byte_size','page_count','sha256','blob_path'].map(c=>['workspace_document',c,'INSERT']),
    ...['storage_provider','storage_site_id','storage_drive_id'].map(c=>['workspace_document',c,'INSERT']),
    ...['status','moderated','version','updated_at'].map(c=>['workspace_document',c,'UPDATE']),
    ['workspace_document_control','reserved_bytes','UPDATE'],
  ]) await check('SELECT has_column_privilege($1,$2,$3,$4) AS allowed', [runtimeRole, `public.${table}`,column,privilege], true);
  for (const [table, column, privilege] of [
    ['workspace_member','role','INSERT'], ['workspace_member','created_at','INSERT'],
    ...['tenant_id','object_id','created_at'].map(c => ['workspace_member',c,'UPDATE']),
    ['workspace_audit','id','INSERT'], ['workspace_audit','created_at','INSERT'],
    ['workspace_control','id','INSERT'],
    ...['id','tenant_id','author_object_id','created_at'].map(c=>['workspace_announcement',c,'UPDATE']),
    ...['status','pinned','moderated','comments_enabled','version','created_at','updated_at','published_at'].map(c=>['workspace_announcement',c,'INSERT']),
    ...['id','tenant_id','announcement_id','author_object_id','body','created_at'].map(c=>['workspace_comment',c,'UPDATE']),
    ...['created_at','hidden_at','hidden_by_object_id'].map(c=>['workspace_comment',c,'INSERT']),
    ...['id','tenant_id','uploader_object_id','title','description','folder','filename','byte_size','page_count','sha256','blob_path','created_at'].map(c=>['workspace_document',c,'UPDATE']),
    ...['storage_provider','storage_site_id','storage_drive_id'].map(c=>['workspace_document',c,'UPDATE']),
    ...['status','moderated','version','created_at','updated_at'].map(c=>['workspace_document',c,'INSERT']),
    ['workspace_document_control','id','UPDATE'],
    ...['id','reserved_bytes'].map(c=>['workspace_document_control',c,'INSERT']),
  ]) await check('SELECT has_column_privilege($1,$2,$3,$4) AS allowed', [runtimeRole, `public.${table}`,column,privilege], false);
  await check("SELECT has_any_column_privilege($1,'public.workspace_audit','UPDATE') AS allowed", [runtimeRole], false);
  for (const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE']) {
    await check('SELECT has_table_privilege($1,\'public.workspace_migration\',$2) AS allowed', [runtimeRole,privilege], false);
  }
  await check("SELECT has_sequence_privilege($1,'public.workspace_audit_id_seq','USAGE') AS allowed", [runtimeRole], true);
  await check("SELECT has_sequence_privilege($1,'public.workspace_audit_id_seq','UPDATE') AS allowed", [runtimeRole], false);
  for (const privilege of ['INSERT','UPDATE']) {
    await check('SELECT has_table_privilege($1,\'public.workspace_throttle\',$2) AS allowed', [runtimeRole,privilege], true);
  }
  return {loginEnabled: row.rolcanlogin};
}
