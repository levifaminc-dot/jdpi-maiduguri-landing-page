// Local credential provisioning. Never prints secrets. Existing values are kept.
import {readFile, writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const target = new URL('../.env.local', import.meta.url);
let text = '';
try {text = await readFile(target, 'utf8');} catch (error) {if (error.code !== 'ENOENT') throw error;}
const additions = {
  MICROSOFT_TENANT_ID:'2b64e4e5-af74-4b92-baab-b3621aef964d',
  MICROSOFT_CLIENT_ID:'80ceea92-5a36-4e3e-a73b-51742b72ce35',
  MICROSOFT_CLIENT_SECRET:'',
  BETTER_AUTH_SECRET:randomBytes(48).toString('base64url'),
  BETTER_AUTH_URL:'http://localhost:4330',
};
for (const [key,value] of Object.entries(additions)) if (!new RegExp(`^${key}=`, 'm').test(text)) text += `\n${key}=${value}`;
await writeFile(target, `${text.trim()}\n`, {mode:0o600});
console.log('Ignored local configuration prepared. No credential values displayed.');
