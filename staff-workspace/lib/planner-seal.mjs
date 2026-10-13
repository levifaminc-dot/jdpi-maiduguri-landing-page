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
  if (typeof sealed !== 'string' || sealed.length > 4000) return null;
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
