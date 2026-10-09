import {parseEnv} from 'node:util';
import {runtimeRole} from './runtime-role-policy.mjs';

// Safe, fixed feedback: never include the supplied password in an error.
export function runtimePasswordProblem(password) {
  if(typeof password!=='string' || password.length<24) return 'The password needs at least 24 characters. Use a unique 32-character password from your password manager.';
  if(password.length>128) return 'The password must contain no more than 128 characters.';
  if(!/^[!-~]+$/.test(password)) return 'Use ordinary English letters, numbers and symbols only, without spaces, accents or emoji.';
  return null;
}

// OWNER CLI ONLY. Neon rejects precomputed hashes at commit. The password must
// reach Neon over verified TLS; NEVER log this SQL or pass it via shell args.
// E-string escaping is explicit and independent of standard_conforming_strings.
export function runtimeActivationSql(password) {
  const problem=runtimePasswordProblem(password);
  if(problem) throw new Error(problem);
  if(password.startsWith('SCRAM-SHA-256$') || /^md5[0-9a-f]{32}$/.test(password)) throw new Error('Use an original password, not a password hash.');
  const literal=password.replaceAll('\\','\\\\').replaceAll("'","''");
  return `ALTER ROLE ${runtimeRole} LOGIN PASSWORD E'${literal}'`;
}

export function runtimeConnectionUrl(appUrl, operatorUrl, password) {
  // Validate the password without accepting connection/SQL fragments.
  const problem=runtimePasswordProblem(password);
  if(problem) throw new Error(problem);
  const app=new URL(appUrl), operator=new URL(operatorUrl);
  if (!app.hostname.endsWith('.neon.tech') || !app.hostname.includes('-pooler.') ||
      app.hostname.replace('-pooler.','.')!==operator.hostname ||
      app.pathname!=='/jdpi_staff' || operator.pathname!==app.pathname ||
      !['postgres:','postgresql:'].includes(app.protocol) || app.hash || operator.hash) {
    throw new Error('Expected the existing matching pooled/direct JDPI Neon connection.');
  }
  app.username='jdpi_workspace_runtime';
  app.password=password;
  return app.toString();
}

export function runtimeRecovery(text,operatorUrl) {
  if(typeof text!=='string' || Buffer.byteLength(text)>4096) throw new Error('Invalid private recovery file.');
  const values=parseEnv(text);
  if(Object.keys(values).length!==1 || !values.DATABASE_URL) throw new Error('Recovery file must contain only DATABASE_URL.');
  const url=new URL(values.DATABASE_URL);
  if(url.username!=='jdpi_workspace_runtime') throw new Error('Recovery file is not the limited runtime connection.');
  const password=decodeURIComponent(url.password);
  const connection=runtimeConnectionUrl(values.DATABASE_URL,operatorUrl,password);
  return {password,connection};
}
