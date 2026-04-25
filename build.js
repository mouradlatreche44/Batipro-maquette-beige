import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';

const out = 'dist';
if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync('index.html', `${out}/index.html`);
cpSync('assets', `${out}/assets`, { recursive: true });
cpSync('.htaccess', `${out}/.htaccess`);

console.log(`Built static site → ${out}/`);
