// Operator-only provisioning. Request handlers do not import this module.
import {runtimeRole} from './runtime-role-policy.mjs';
const columns=['display_name','work_email','job_title','office','work_state','introduction'];
export const staffDirectoryGrantsSql=`GRANT INSERT(${columns.join(',')}),UPDATE(${columns.join(',')}) ON workspace_staff_profile TO ${runtimeRole};
  GRANT SELECT ON workspace_staff_private_profile TO ${runtimeRole};
  GRANT INSERT(tenant_id,object_id,phone,home_address),UPDATE(phone,home_address,version,updated_at) ON workspace_staff_private_profile TO ${runtimeRole};`;
export async function verifyStaffDirectoryGrants(db){
  for(const [privilege,expected] of [['SELECT',true],['DELETE',false],['TRUNCATE',false],['TRIGGER',false],['REFERENCES',false]])if((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',[runtimeRole,'workspace_staff_private_profile',privilege])).rows[0].allowed!==expected)throw new Error('Unsafe private profile privileges.');
  for(const column of ['tenant_id','object_id','phone','home_address','version','updated_at'])for(const privilege of ['INSERT','UPDATE']){
    const expected=privilege==='INSERT'?['tenant_id','object_id','phone','home_address'].includes(column):['phone','home_address','version','updated_at'].includes(column);
    if((await db.query('SELECT has_column_privilege($1,$2,$3,$4) AS allowed',[runtimeRole,'workspace_staff_private_profile',column,privilege])).rows[0].allowed!==expected)throw new Error('Unsafe private profile column privileges.');
  }
  for(const column of columns)for(const privilege of ['INSERT','UPDATE'])if(!(await db.query('SELECT has_column_privilege($1,$2,$3,$4) AS allowed',[runtimeRole,'workspace_staff_profile',column,privilege])).rows[0].allowed)throw new Error('Missing directory privileges.');
}
