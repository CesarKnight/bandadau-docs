#!/usr/bin/env node
// Ensambla el documento entregable (Word) a partir de `capitulos/*.md` y de la documentación ICONIX de `docs/`.
//
//   node entregable/build.mjs            # genera build/documento.md, imágenes y el .docx
//   node entregable/build.mjs --no-docx  # solo el Markdown consolidado
//
// Requisitos: pandoc (>= 3) y @mermaid-js/mermaid-cli (mmdc) con un Chrome/Chromium.
//   MMDC=/ruta/a/mmdc  PUPPETEER_CONFIG=/ruta/a/puppeteer.json  (opcionales)
//
// Los capítulos son Markdown normal más directivas de una línea que traen contenido ya escrito en docs/:
//   @@include <ruta-en-docs> [section="regex"] [demote=N] [keeph1=1] [dropheading=1]
//   @@uc section=1|2|3|5 numprefix=2.6 [sub="regex"] [preamble=1]      (una vez por cada UC-xx)
//   @@uc-test-summary                                                  (casos de aceptación por UC)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(HERE, '../docs');
const BUILD = path.join(HERE, 'build');
const IMG = path.join(BUILD, 'img');
const OUT_DOCX = path.join(HERE, 'Bandada-U-Documento-Entregable.docx');
const MMDC = process.env.MMDC || 'mmdc';
const PPCONF = process.env.PUPPETEER_CONFIG || '';
const NO_DOCX = process.argv.includes('--no-docx');
const NO_RENDER = process.argv.includes('--no-render');
const SCALE = 1.6; // factor de escala de los PNG de Mermaid (equilibrio nitidez/tamaño del .docx)

fs.mkdirSync(IMG, { recursive: true });

// ---------------------------------------------------------------- utilidades de Markdown
const FENCE = /^\s*(```|~~~)/;

function headingLevel(line) {
  const m = /^(#{1,6})\s+\S/.exec(line);
  return m ? m[1].length : 0;
}

/** Recorre líneas ignorando bloques de código; `fn(line, i, inFence)`. */
function eachLine(lines, fn) {
  let fence = false;
  lines.forEach((l, i) => {
    if (FENCE.test(l)) {
      fn(l, i, true);
      fence = !fence;
      return;
    }
    fn(l, i, fence);
  });
}

function demote(lines, n) {
  if (!n) return lines;
  const out = [];
  eachLine(lines, (l, _i, inFence) => {
    const lv = inFence ? 0 : headingLevel(l);
    if (!lv) return out.push(l);
    const nl = Math.max(1, lv + n); // n < 0 promueve
    out.push(nl <= 6 ? '#'.repeat(nl) + l.slice(lv) : `**${l.slice(lv).trim()}**`);
  });
  return out;
}

function extractSection(lines, re) {
  let start = -1;
  let level = 0;
  eachLine(lines, (l, i, inFence) => {
    if (start >= 0 || inFence) return;
    const lv = headingLevel(l);
    if (lv && re.test(l.replace(/^#+\s+/, ''))) {
      start = i;
      level = lv;
    }
  });
  if (start < 0) return null;
  let end = lines.length;
  let fence = false;
  for (let i = start + 1; i < lines.length; i++) {
    if (FENCE.test(lines[i])) fence = !fence;
    if (!fence) {
      const lv = headingLevel(lines[i]);
      if (lv && lv <= level) {
        end = i;
        break;
      }
    }
  }
  return { heading: lines[start], body: lines.slice(start + 1, end), level };
}

function readDoc(rel) {
  const p = path.join(DOCS, rel);
  if (!fs.existsSync(p)) throw new Error(`No existe docs/${rel}`);
  return fs.readFileSync(p, 'utf8').split('\n');
}

function parseOpts(str) {
  const o = {};
  const re = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let m;
  while ((m = re.exec(str))) o[m[1]] = m[2] ?? m[3];
  return o;
}

function stripH1(lines) {
  const i = lines.findIndex((l) => headingLevel(l) === 1);
  if (i < 0) return lines;
  return [...lines.slice(0, i), ...lines.slice(i + 1)];
}

/** Reescribe imágenes relativas de un doc fuente a rutas absolutas y les fija ancho 100 %. */
function rewriteImagePaths(lines, sourceRel) {
  const base = path.dirname(path.join(DOCS, sourceRel));
  return lines.map((line) =>
    line.replace(/(!\[[^\]]*\]\()([^)\s]+)(\))(\{[^}]*\})?/g, (m, pre, target, close, attrs) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/')) return m;
      const abs = path.resolve(base, decodeURIComponent(target));
      return `${pre}${abs}${close}${attrs || '{width=100%}'}`;
    }),
  );
}

// ---------------------------------------------------------------- directivas
function ucFiles() {
  const dir = path.join(DOCS, '02-iconix/03-casos-de-uso');
  return fs
    .readdirSync(dir)
    .filter((f) => /^UC-\d+/.test(f))
    .sort()
    .map((f) => {
      const rel = `02-iconix/03-casos-de-uso/${f}`;
      const lines = rewriteImagePaths(fs.readFileSync(path.join(dir, f), 'utf8').split('\n'), rel);
      const h1 = lines.find((l) => headingLevel(l) === 1) || '';
      const m = /^#\s+(UC-\d+)\s+—\s+(.*)$/.exec(h1);
      return { file: f, lines, id: m ? m[1] : f, title: m ? m[2].trim() : f };
    });
}

// Quita los bloques "### P-xxx" (pantallas) que no pertenecen a ningún caso de uso clave.
function filterScreens(lines) {
  const out = [];
  let skip = false;
  for (const l of lines) {
    const lv = headingLevel(l);
    if (lv && lv <= 3) {
      skip = false;
      if (lv === 3 && /^###\s+P-/.test(l)) {
        const refs = (l.split('·')[0].match(/UC-\d+/g) || []);
        skip = refs.length > 0 && !refs.some((u) => KEY_UCS.includes(u));
      }
    }
    if (!skip) out.push(l);
  }
  return out;
}

function expandInclude(opts) {
  let lines = rewriteImagePaths(readDoc(opts.path), opts.path);
  if (opts.filterkey === '1') lines = filterScreens(lines);
  if (opts.section) {
    const s = extractSection(lines, new RegExp(opts.section));
    if (!s) throw new Error(`Sección /${opts.section}/ no encontrada en ${opts.path}`);
    lines = opts.dropheading === '0' ? [s.heading, ...s.body] : s.body;
    return demote(lines, Number(opts.demote || 0));
  }
  if (opts.keeph1 !== '1') lines = stripH1(lines);
  return demote(lines, Number(opts.demote || 0));
}

// Casos de uso clave: se detallan completos; el resto solo aparece en tablas de síntesis.
const KEY_UCS = ['UC-01', 'UC-05', 'UC-12', 'UC-13', 'UC-14', 'UC-15', 'UC-19', 'UC-20', 'UC-22'];

function field(uc, name, trim = true) {
  for (const l of uc.lines) {
    const m = new RegExp(`^\\|\\s*${name}\\s*\\|\\s*(.*?)\\s*\\|\\s*$`).exec(l);
    if (m) return m[1].replace(/\|/g, '/').replace(trim ? /\s*[\(,].*$/ : /$^/, '');
  }
  return '—';
}

function expandUcOthers() {
  const rows = ['| Caso de uso | Paquete | Actor principal | Prioridad | Requisitos |', '|---|---|---|---|---|'];
  for (const uc of ucFiles()) {
    if (KEY_UCS.includes(uc.id)) continue;
    rows.push(`| ${uc.id} — ${uc.title} | ${field(uc, 'Paquete')} | ${field(uc, 'Actor principal')} | ${field(uc, 'Prioridad \\(MoSCoW\\)')} | ${field(uc, 'Requisitos', false).replace(/\s*\(.*?\)/g, '')} |`);
  }
  return rows;
}

function expandUc(opts) {
  const out = [];
  const sec = Number(opts.section);
  const list = opts.all === '1' ? ucFiles() : ucFiles().filter((u) => KEY_UCS.includes(u.id));
  list.forEach((uc, idx) => {
    const num = `${opts.numprefix}.${idx + 1}`;
    out.push('', `### ${num} ${uc.id} — ${uc.title}`, '');
    if (opts.preamble === '1') {
      // Cuadro de cabecera del UC (entre el H1 y el primer H2)
      const first = uc.lines.findIndex((l, i) => i > 0 && headingLevel(l) === 2);
      const pre = uc.lines.slice(0, first < 0 ? uc.lines.length : first);
      out.push(...stripH1(pre).filter((l) => !/^---\s*$/.test(l)), '');
    }
    const s = extractSection(uc.lines, new RegExp(`^${sec}\\.`));
    if (!s) {
      out.push('_Sección no disponible en la fuente._', '');
      return;
    }
    let body = s.body;
    if (opts.sub) {
      const sub = extractSection(body, new RegExp(opts.sub));
      body = sub ? sub.body : ['_No se definieron reglas específicas._'];
    }
    out.push(...demote(body, 1), '');
  });
  return out;
}

function expandUcTestSummary() {
  const rows = ['| Caso de uso | Casos de aceptación | Identificadores |', '|---|---|---|'];
  let total = 0;
  for (const uc of ucFiles()) {
    const s = extractSection(uc.lines, /^5\./);
    const ids = [];
    const key = KEY_UCS.includes(uc.id);
    if (s) {
      for (const l of s.body) {
        const m = /^\|\s*(AT-[\w-]+|IT-[\w-]+|E2E-[\w-]+|NFR-[\w-]+)/.exec(l);
        if (m) ids.push(m[1]);
      }
    }
    total += ids.length;
    const range = ids.length ? (ids.length > 3 ? `${ids[0]} … ${ids[ids.length - 1]}` : ids.join(', ')) : '—';
    rows.push(`| ${uc.id} — ${uc.title}${key ? ' (clave)' : ''} | ${ids.length} | ${range} |`);
  }
  rows.push(`| **Total** | **${total}** | |`);
  return rows;
}

function expandDirectives(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = /^@@(include|uc-test-summary|uc-others|uc)\s*(.*)$/.exec(line);
    if (!m) {
      out.push(line);
      continue;
    }
    const kind = m[1];
    if (kind === 'include') {
      const mm = /^(\S+)\s*(.*)$/.exec(m[2]);
      out.push(...expandInclude({ path: mm[1], ...parseOpts(mm[2]) }), '');
    } else if (kind === 'uc-others') {
      out.push(...expandUcOthers(), '');
    } else if (kind === 'uc') {
      out.push(...expandUc(parseOpts(m[2])));
    } else {
      out.push(...expandUcTestSummary(), '');
    }
  }
  return out.join('\n');
}

// ---------------------------------------------------------------- limpieza para Word
function cleanForWord(text) {
  const lines = text.split('\n');
  const out = [];
  eachLine(lines, (l, _i, inFence) => {
    if (inFence) return out.push(l);
    let s = l;
    s = s.replace(/<br\s*\/?>/gi, ' ');
    s = s.replace(/<!--.*?-->/g, '');
    // enlaces a archivos .md locales -> solo el texto
    s = s.replace(/\[([^\]]+)\]\((?!https?:)[^)]*\.md[^)]*\)/g, '$1');
    s = s.replace(/\[([^\]]+)\]\((?!https?:)[^)]*\/\)/g, '$1');
    out.push(s);
  });
  return out.join('\n');
}

/** Ajusta el ancho relativo de las columnas de las tablas pipe según el contenido. */
function tuneTables(text) {
  const lines = text.split('\n');
  const res = [...lines];
  let fence = false;
  for (let i = 0; i < lines.length - 1; i++) {
    if (FENCE.test(lines[i])) fence = !fence;
    if (fence) continue;
    const sep = lines[i + 1];
    if (!/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(sep) || !lines[i].includes('|')) continue;
    const split = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/);
    const header = split(lines[i]);
    const n = header.length;
    const widths = new Array(n).fill(0);
    const bodyRows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      bodyRows.push(split(lines[j]));
      j++;
    }
    [header, ...bodyRows].forEach((cells) =>
      cells.forEach((c, k) => {
        if (k < n) widths[k] = Math.max(widths[k], Math.min(c.trim().length, 90));
      }),
    );
    const clamp = widths.map((w) => Math.max(w, 6));
    const total = clamp.reduce((a, b) => a + b, 0);
    const dashes = clamp.map((w) => '-'.repeat(Math.max(3, Math.round((w / total) * 100))));
    const aligns = split(sep).map((c) => {
      const t = c.trim();
      return [t.startsWith(':') ? ':' : '', t.endsWith(':') ? ':' : ''];
    });
    res[i + 1] = '|' + dashes.map((d, k) => `${aligns[k]?.[0] ?? ''}${d}${aligns[k]?.[1] ?? ''}`).join('|') + '|';
    i = j - 1;
  }
  return res.join('\n');
}

// ---------------------------------------------------------------- Mermaid -> PNG
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function renderMermaid(code, hash) {
  return new Promise((resolve) => {
    const png = path.join(IMG, `${hash}.png`);
    if (fs.existsSync(png)) return resolve({ ok: true, png });
    const mmd = path.join(IMG, `${hash}.mmd`);
    fs.writeFileSync(mmd, code);
    const args = ['-i', mmd, '-o', png, '-s', String(SCALE), '-w', '1800', '-b', 'white', '--quiet'];
    if (PPCONF) args.push('-p', PPCONF);
    const p = spawn(MMDC, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.stdout.on('data', (d) => (err += d));
    p.on('close', (c) => resolve(c === 0 && fs.existsSync(png) ? { ok: true, png } : { ok: false, err: err.slice(0, 400) }));
  });
}

async function pool(items, n, fn) {
  const res = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < items.length) {
        const i = next++;
        res[i] = await fn(items[i], i);
      }
    }),
  );
  return res;
}

async function processMermaid(text) {
  const lines = text.split('\n');
  const blocks = [];
  const out = [];
  let i = 0;
  let lastHeading = 'Diagrama';
  while (i < lines.length) {
    const l = lines[i];
    if (/^```mermaid\s*$/.test(l)) {
      let j = i + 1;
      while (j < lines.length && !/^```\s*$/.test(lines[j])) j++;
      const code = lines.slice(i + 1, j).join('\n');
      const hash = crypto.createHash('sha1').update(`s${SCALE}:${code}`).digest('hex').slice(0, 16);
      blocks.push({ code, hash });
      out.push({ mermaid: blocks.length - 1, caption: lastHeading });
      i = j + 1;
      continue;
    }
    if (FENCE.test(l)) {
      // copiar bloque de código tal cual
      out.push(l);
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) out.push(lines[i++]);
      if (i < lines.length) out.push(lines[i++]);
      continue;
    }
    const lv = headingLevel(l);
    if (lv) lastHeading = l.replace(/^#+\s+/, '').replace(/^[\d.]+\s+/, '').replace(/[`*]/g, '').trim();
    out.push(l);
    i++;
  }
  const uniq = [...new Map(blocks.map((b) => [b.hash, b])).values()];
  console.log(`Mermaid: ${blocks.length} diagramas (${uniq.length} únicos)`);
  const results = new Map();
  if (!NO_RENDER) {
    let done = 0;
    await pool(uniq, 4, async (b) => {
      const r = await renderMermaid(b.code, b.hash);
      results.set(b.hash, r);
      if (!r.ok) console.warn(`  ✗ ${b.hash}: ${r.err?.split('\n')[0]}`);
      if (++done % 10 === 0) console.log(`  ${done}/${uniq.length}`);
    });
  }
  let fig = 0;
  let failed = 0;
  const final = out.map((o) => {
    if (typeof o === 'string') return o;
    const b = blocks[o.mermaid];
    const r = results.get(b.hash);
    if (!r?.ok) {
      failed++;
      return '```\n' + b.code + '\n```';
    }
    fig++;
    const { w } = pngSize(r.png);
    const cssW = w / SCALE;
    const inches = Math.min(6.4, Math.max(1.5, cssW / 96));
    const width = cssW > 560 ? '100%' : `${inches.toFixed(2)}in`;
    const cap = o.caption.replace(/[\[\]]/g, '');
    return `\n![Figura ${fig}. ${cap}](img/${b.hash}.png){width=${width}}\n`;
  });
  console.log(`Figuras: ${fig}; sin renderizar: ${failed}`);
  return final.join('\n');
}

// ---------------------------------------------------------------- principal
const capDir = path.join(HERE, 'capitulos');
const files = fs.readdirSync(capDir).filter((f) => f.endsWith('.md')).sort();
let doc = files.map((f) => expandDirectives(fs.readFileSync(path.join(capDir, f), 'utf8'))).join('\n\n');
// Los bloques <details> son fuentes para otras herramientas (p. ej. Mermaid para EA):
// no se incluyen en el Word para no duplicar figuras.
doc = doc.replace(/<details[\s\S]*?<\/details>/gi, '');
doc = cleanForWord(doc);
doc = await processMermaid(doc);
doc = tuneTables(doc);
const mdPath = path.join(BUILD, 'documento.md');
fs.writeFileSync(mdPath, doc);
console.log(`Markdown consolidado: ${mdPath} (${doc.split(/\s+/).length} palabras aprox.)`);

if (!NO_DOCX) {
  const ref = path.join(HERE, 'reference.docx');
  const args = [mdPath, '-f', 'commonmark_x', '-o', OUT_DOCX, '--resource-path', `${BUILD}:${HERE}`, '--wrap=none'];
  if (fs.existsSync(ref)) args.push('--reference-doc', ref);
  const r = spawnSync('pandoc', args, { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`Word: ${OUT_DOCX} (${(fs.statSync(OUT_DOCX).size / 1048576).toFixed(1)} MB)`);
}
