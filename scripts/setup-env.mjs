import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const path = new URL('../.env', import.meta.url);
let content = readFileSync(existsSync(path) ? path : new URL('../.env.example', import.meta.url), 'utf8');
if (!/^BETTER_AUTH_URL=/m.test(content)) content += '\nBETTER_AUTH_URL=http://127.0.0.1:3000\n';
if (!/^BETTER_AUTH_SECRET=.+/m.test(content)) {
  content = content.replace(/^BETTER_AUTH_SECRET=.*\r?\n?/m, '');
  content += `\nBETTER_AUTH_SECRET=${randomBytes(32).toString('base64')}\n`;
}
writeFileSync(path, content);
console.log('Local environment ready. Existing values preserved; authentication secret saved in .env.');
