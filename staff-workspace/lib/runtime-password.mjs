import {createHash,createHmac,pbkdf2Sync,randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';

// Safe, fixed feedback: never include the supplied password in an error.
export function runtimePasswordProblem(password) {
  if(typeof password!=='string' || password.length<24) return 'The password needs at least 24 characters. Use a unique 32-character password from your password manager.';
  if(password.length>128) return 'The password must contain no more than 128 characters.';
  if(!/^[!-~]+$/.test(password)) return 'Use ordinary English letters, numbers and symbols only, without spaces, accents or emoji.';
  return null;
}

// PostgreSQL SCRAM-SHA-256 verifier. ASCII-only input avoids Unicode/SASLprep
// differences. Only the verifier, never plaintext, appears in ALTER ROLE SQL.
export function runtimePasswordVerifier(password, salt=randomBytes(16)) {
  const problem=runtimePasswordProblem(password);
  if(problem) throw new Error(problem);
  if (!Buffer.isBuffer(salt) || salt.length!==16) throw new Error('Invalid verifier salt.');
  const iterations=4096;
  const salted=pbkdf2Sync(password,salt,iterations,32,'sha256');
  const client=createHmac('sha256',salted).update('Client Key').digest();
  const stored=createHash('sha256').update(client).digest('base64');
  const server=createHmac('sha256',salted).update('Server Key').digest('base64');
  return `SCRAM-SHA-256$${iterations}:${salt.toString('base64')}$${stored}:${server}`;
}

export function runtimeConnectionUrl(appUrl, operatorUrl, password) {
  // Validate the password without accepting connection/SQL fragments.
  runtimePasswordVerifier(password,Buffer.alloc(16));
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
