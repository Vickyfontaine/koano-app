// Mobile render drop-in check (UI sprint WS6). Lists each render in the
// manifest and whether a 4:5 mobile file exists at public/renders/mobile/<name>.webp.
// When one exists, flip `mobile: true` for that entry in
// src/components/marketing/renders.ts and the <picture> serves it below 768px.
import fs from 'node:fs';
import path from 'node:path';
const src = fs.readFileSync('src/components/marketing/renders.ts', 'utf8');
const names = [...src.matchAll(/^\s*"?([a-z-]+)"?:\s*\{/gm)].map((m) => m[1]);
const dir = path.join('public', 'renders', 'mobile');
const present = fs.existsSync(dir) ? new Set(fs.readdirSync(dir)) : new Set();
let ready = 0;
for (const n of names) {
  const file = `${n}.webp`;
  const has = present.has(file);
  const flagged = new RegExp(`"${n}":\\s*\\{[^}]*mobile:\\s*true`).test(src);
  if (has) ready += 1;
  console.log(`${has ? 'present' : 'missing'}  ${file.padEnd(24)} manifest mobile=${flagged}${has && !flagged ? '  <- flip mobile: true' : ''}${!has && flagged ? '  <- flagged but no file' : ''}`);
}
console.log(`${ready} of ${names.length} mobile renders present`);
