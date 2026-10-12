// Operator-only. Separate from existing grants to keep older installs compatible.
import {runtimeRole} from './runtime-role-policy.mjs';
export const staffTagGrantsSql=`GRANT SELECT, DELETE ON public.workspace_announcement_tag,public.workspace_document_tag TO ${runtimeRole};
  GRANT INSERT(tenant_id,resource_id,staff_object_id,tagged_by_object_id) ON public.workspace_announcement_tag,public.workspace_document_tag TO ${runtimeRole};`;
export async function verifyStaffTagGrants(db){
  for(const table of ['workspace_announcement_tag','workspace_document_tag']){
    for(const [privilege,expected] of [['SELECT',true],['DELETE',true],['UPDATE',false],['TRUNCATE',false],['TRIGGER',false],['REFERENCES',false]]){
      const allowed=(await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[runtimeRole,`public.${table}`,privilege])).rows[0].allowed;
      if(allowed!==expected)throw new Error('Unsafe staff tag privileges.');
    }
    for(const column of ['tenant_id','resource_id','staff_object_id','tagged_by_object_id','created_at']){
      const allowed=(await db.query("SELECT has_column_privilege($1,$2,$3,'INSERT') AS allowed",[runtimeRole,`public.${table}`,column])).rows[0].allowed;
      if(allowed!==(column!=='created_at'))throw new Error('Unsafe staff tag insert privileges.');
    }
    if((await db.query("SELECT has_any_column_privilege($1,$2,'UPDATE') AS allowed",[runtimeRole,`public.${table}`])).rows[0].allowed)throw new Error('Unsafe staff tag update privileges.');
  }
}
