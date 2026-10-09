import {createHash,createHmac,pbkdf2Sync,randomBytes} from 'node:crypto';

// PostgreSQL SCRAM-SHA-256 verifier. ASCII-only input avoids Unicode/SASLprep
// differences. Only the verifier, never plaintext, appears in ALTER ROLE SQL.
export function runtimePasswordVerifier(password, salt=randomBytes(16)) {
  if (typeof password!=='string' || !/^[!-~]{24,128}$/.test(password)) {
    throw new Error('Use a password-manager-generated 24–128 character ASCII password without spaces.');
  }
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
