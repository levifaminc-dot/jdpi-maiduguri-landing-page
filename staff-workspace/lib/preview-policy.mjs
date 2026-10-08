// Preview access never depends on a query string, role switch or deployment env flag.
export function allowLocalPreview({nodeEnv, vercel, host}) {
  return nodeEnv === 'development' && !vercel && /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host || '');
}
export function canManageMembers(actor) {
  return actor?.status === 'Active' && actor?.role === 'Admin';
}
