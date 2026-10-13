import {createCipheriv, createDecipheriv, hkdfSync, randomBytes} from 'node:crypto';

function key(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('Planner encryption key is not configured');
  return Buffer.from(hkdfSync('sha256', Buffer.from(secret), Buffer.from('jdpi-planner-v1'), Buffer.from('cookie-seal'), 32));
}
export function sealPlanner(value, secret) {
  const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm', key(secret), iv);
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return `${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}`;
}
export function openPlanner(sealed, secret) {
  if (typeof sealed !== 'string' || sealed.length > 5000) return null;
  const parts=sealed.split('.');
  if (parts.length !== 3) return null;
  try {
    const [iv,data,tag]=parts.map(part=>Buffer.from(part,'base64url'));
    if (iv.length!==12 || tag.length!==16) return null;
    const decipher=createDecipheriv('aes-256-gcm',key(secret),iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8'));
  } catch {return null;}
}

// Browser cookies have a roughly 4 KB per-cookie limit. A Graph access token
// becomes larger when authenticated encryption and base64url are applied.
export function splitPlannerTicket(sealed) {
  if (typeof sealed !== 'string' || !sealed || sealed.length > 5000) return null;
  return [sealed.slice(0,2500),sealed.slice(2500)];
}

export function joinPlannerTicket(first,second) {
  if (typeof first !== 'string' || !first || first.length > 2500 ||
      (second != null && (typeof second !== 'string' || second.length > 2500))) return null;
  return first+(second ?? '');
}
