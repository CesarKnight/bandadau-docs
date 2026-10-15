// Verifica que cada enlace Markdown relativo apunte a un archivo/carpeta existente.
// Ignora URLs (http, https, mailto, etc.), anclas puras (#x) y el contenido de bloques de código.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skipDirs = new Set(['.git', 'node_modules']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name.endsWith('.md')) yield p;
  }
}

let checked = 0;
const broken = [];
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  let inFence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    const noCode = line.replace(/`[^`]*`/g, '');
    for (const m of noCode.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      let target = m[1].replace(/^<|>$/g, '');
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      target = decodeURIComponent(target.split('#')[0].split('?')[0]);
      if (!target) continue;
      checked++;
      const abs = target.startsWith('/') ? join(root, target) : resolve(dirname(file), target);
      if (!existsSync(abs)) broken.push(`${file.slice(root.length + 1)}:${i + 1} -> ${m[1]}`);
    }
  });
}
if (broken.length) {
  console.error(`${broken.length} enlace(s) roto(s) de ${checked}:\n` + broken.map((b) => '  ' + b).join('\n'));
  process.exit(1);
}
console.log(`links OK (${checked} enlaces relativos verificados)`);
