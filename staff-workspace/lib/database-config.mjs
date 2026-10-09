// Private credentials are never returned to clients or logged.
export function databaseConfig(env) {
  if (!env.DATABASE_URL) return null;
  const url = new URL(env.DATABASE_URL);
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if (!['postgres:','postgresql:'].includes(url.protocol) || !url.username || !url.password || url.pathname.length < 2 || url.hash) throw new Error('Invalid database settings.');
  if (local && (env.NODE_ENV !== 'development' || env.VERCEL)) throw new Error('Local database is development only.');
  if (!local && !url.hostname.endsWith('.neon.tech')) throw new Error('Use the approved Neon database host.');
  // pg parses sslmode=require as relaxed validation. Strip TLS URL overrides
  // and always verify the server certificate for hosted connections.
  for (const key of [...url.searchParams.keys()]) {
    if (!['sslmode','channel_binding'].includes(key)) throw new Error('Unsupported database connection option.');
    url.searchParams.delete(key);
  }
  return {connectionString:url.toString(), ssl:local ? false : {rejectUnauthorized:true}, max:5, connectionTimeoutMillis:10000, idleTimeoutMillis:10000, statement_timeout:15000};
}
