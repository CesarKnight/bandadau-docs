#!/usr/bin/env node
// Genera los scripts JScript de Enterprise Architect a partir de los diagramas Mermaid
// de bandadau-docs/docs. Uso:  node entregable/ea/generar-scripts-ea.mjs
// Salida: entregable/ea/scripts/*.js (ASCII puro, listos para pegar en el Scripting de EA).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..', '..', 'docs');
const OUT = join(HERE, 'scripts');
const runtime = readFileSync(join(HERE, 'runtime.js'), 'utf8');
const issues = [];

// ------------------------------------------------------------------ utilidades
const clean = (s) =>
  (s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^["']|["']$/g, '')
    .trim();

function mermaidBlocks(file) {
  const text = readFileSync(file, 'utf8');
  const out = [];
  const re = /```mermaid\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(0, m.index);
    const heads = [...before.matchAll(/^#+ (.*)$/gm)];
    const h2 = [...before.matchAll(/^## (.*)$/gm)];
    out.push({
      code: m[1],
      heading: heads.length ? heads[heads.length - 1][1].trim() : '',
      section: h2.length ? h2[h2.length - 1][1].trim() : '',
    });
  }
  return out;
}

const warn = (where, line) => issues.push(`${where}: no interpretado -> ${line}`);

// ------------------------------------------------------------------ flowchart
const SHAPES = [
  [/^\(\["?(.*?)"?\]\)$/, 'stadium'],
  [/^\[\/"?(.*?)"?\/\]$/, 'para'],
  [/^\(\("?(.*?)"?\)\)$/, 'circle'],
  [/^\[\("?(.*?)"?\)\]$/, 'cyl'],
  [/^\["?(.*?)"?\]$/, 'rect'],
];

function parseEndpoint(txt) {
  const m = txt.trim().match(/^(\w+)\s*(.*)$/);
  if (!m) return null;
  if (!m[2]) return { id: m[1] };
  for (const [re, shape] of SHAPES) {
    const s = m[2].match(re);
    if (s) return { id: m[1], shape, label: clean(s[1]) };
  }
  return null;
}

function parseFlowchart(code, where) {
  const nodes = new Map();
  const edges = [];
  const groups = [];
  const stack = [];
  const upsert = (ep) => {
    if (!ep) return null;
    let n = nodes.get(ep.id);
    if (!n) {
      n = { id: ep.id, group: stack.length ? stack[stack.length - 1] : '' };
      nodes.set(ep.id, n);
    }
    if (ep.label) {
      n.shape = ep.shape;
      n.label = ep.label;
    }
    return n;
  };
  for (const raw of code.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line || line.startsWith('%%') || /^(direction|classDef|class |style|linkStyle)\b/.test(line)) continue;
    const sg = line.match(/^subgraph\s+(\w+)(?:\s*\["?(.*?)"?\])?$/);
    if (sg) {
      const name = clean(sg[2] || sg[1].replace(/_/g, ' '));
      stack.push(name);
      groups.push(name);
      continue;
    }
    if (line === 'end') {
      stack.pop();
      continue;
    }
    if (/(-->|-\.->|==>|---|-\.-)/.test(line)) {
      const parts = line.split(/\s*(?:-->|-\.->|==>|---|-\.-)\s*(?:\|([^|]*)\|\s*)?/);
      // parts: [ep0, label1, ep1, label2, ep2...]
      const groupsOfEp = [];
      for (let i = 0; i < parts.length; i += 2) {
        const eps = parts[i].split(/\s+&\s+/).map(parseEndpoint);
        if (eps.some((e) => !e)) {
          warn(where, line);
          groupsOfEp.length = 0;
          break;
        }
        groupsOfEp.push(eps.map(upsert));
      }
      for (let i = 0; i + 1 < groupsOfEp.length; i++) {
        const label = clean(parts[2 * i + 1]);
        for (const a of groupsOfEp[i]) for (const b of groupsOfEp[i + 1]) edges.push({ from: a.id, to: b.id, label });
      }
      continue;
    }
    const ep = parseEndpoint(line);
    if (ep && ep.label) upsert(ep);
    else warn(where, line);
  }
  return { nodes: [...nodes.values()], edges, groups };
}

function robustnessDiagram(code, where, title, path) {
  const g = parseFlowchart(code, where);
  const nodes = g.nodes
    .filter((n) => n.label)
    .map((n) => {
      const m = n.label.match(/^[«<]+\s*(boundary|control|entity)\s*[»>]+\s*(.*)$/i);
      if (m) return { id: n.id, kind: m[1].toLowerCase(), name: m[2] };
      return { id: n.id, kind: 'actor', name: n.label.replace(/^\p{Extended_Pictographic}️?\s*/u, '') };
    });
  const known = new Set(nodes.map((n) => n.id));
  const edges = g.edges
    .filter((e) => known.has(e.from) && known.has(e.to))
    .map((e) => ({ from: e.from, to: e.to, type: 'Association', label: e.label, dir: 'Source -> Destination' }));
  return { type: 'robust', title, path, nodes, edges };
}

function useCaseDiagram(code, where) {
  const g = parseFlowchart(code, where);
  const nodes = g.nodes
    .filter((n) => n.label)
    .map((n) => ({
      id: n.id,
      kind: n.group ? 'usecase' : 'actor',
      name: n.label,
      group: n.group || undefined,
    }));
  const edges = g.edges.map((e) => ({ from: e.from, to: e.to, type: 'Association' }));
  return { type: 'usecase', title: 'Diagrama general de casos de uso', path: ['Casos de uso'], nodes, edges };
}

// ------------------------------------------------------------------ secuencia
const ARROW = /^(\w+)\s*(-->>|->>|--x|-x|--\)|-\)|-->|->)\s*[+-]?\s*(\w+)\s*:\s*(.*)$/;

function sequenceDiagram(code, where, title, path) {
  const nodes = [];
  const edges = [];
  const byId = new Map();
  const frames = [];
  const ensure = (id, label, actor) => {
    let n = byId.get(id);
    if (!n) {
      n = { id, kind: actor ? 'actor' : 'object', name: clean(label || id) };
      byId.set(id, n);
      nodes.push(n);
    } else if (label) {
      n.name = clean(label);
      if (actor) n.kind = 'actor';
    }
    return n;
  };
  let seq = 0;
  for (const raw of code.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line || line.startsWith('%%') || /^(autonumber|activate|deactivate)\b/.test(line)) continue;
    let m = line.match(/^(participant|actor)\s+(\w+)(?:\s+as\s+(.+))?$/);
    if (m) {
      ensure(m[2], m[3], m[1] === 'actor');
      continue;
    }
    m = line.match(/^(alt|opt|loop|par|critical|break|rect)\b\s*(.*)$/);
    if (m) {
      frames.push(m[1] === 'rect' ? null : `${m[1]}${m[2] ? ' ' + clean(m[2]) : ''}`);
      continue;
    }
    m = line.match(/^(else|and)\b\s*(.*)$/);
    if (m) {
      if (frames.length && frames[frames.length - 1] !== null) {
        const base = frames[frames.length - 1].split(' ')[0];
        frames[frames.length - 1] = `${base}/${m[1]}${m[2] ? ' ' + clean(m[2]) : ''}`;
      }
      continue;
    }
    if (line === 'end') {
      frames.pop();
      continue;
    }
    if (/^Note\b/i.test(line)) continue; // las notas no se importan
    m = line.match(ARROW);
    if (m) {
      ensure(m[1]);
      ensure(m[3]);
      seq += 1;
      const frame = [...frames].reverse().find((f) => f !== null);
      const isReturn = m[2].startsWith('--');
      let label = clean(m[4]);
      if (isReturn) label = `(retorno) ${label}`;
      if (frame) label = `[${frame}] ${label}`;
      edges.push({ from: m[1], to: m[3], type: 'Sequence', label, seq });
      continue;
    }
    warn(where, line);
  }
  return { type: 'seq', title, path, nodes, edges };
}

// ------------------------------------------------------------------ clases
const REL =
  /^(\w+)\s*(?:"([^"]*)"\s*)?(<\|--|--\|>|\*--|--\*|o--|--o|-->|<--|\.\.>|<\.\.|\.\.\|>|<\|\.\.|--|\.\.)\s*(?:"([^"]*)"\s*)?(\w+)\s*(?::\s*(.*))?$/;

function parseMember(txt) {
  let t = txt.trim().replace(/;$/, '');
  if (!t) return null;
  let vis = '';
  const v = t.match(/^([+\-#~])\s*(.*)$/);
  if (v) {
    vis = { '+': 'Public', '-': 'Private', '#': 'Protected', '~': 'Package' }[v[1]];
    t = v[2];
  }
  if (t.includes('(')) {
    const m = t.match(/^(.*?)\(([\s\S]*)\)\s*(\$|\*)?\s*(.*)$/);
    if (!m) return { op: { name: t, vis } };
    return { op: { name: m[1].trim(), params: m[2].trim(), ret: m[4].trim(), isStatic: m[3] === '$', vis } };
  }
  const parts = t.split(/\s+/);
  if (parts.length >= 2) return { attr: { name: parts[parts.length - 1], type: parts.slice(0, -1).join(' '), vis } };
  return { attr: { name: t, type: '', vis } };
}

function classDiagram(code, where, title, path) {
  const classes = new Map();
  const edges = [];
  let ns = '';
  let cur = null;
  const ensure = (id) => {
    let c = classes.get(id);
    if (!c) {
      c = { id, kind: 'class', name: id, attrs: [], ops: [], group: ns || undefined };
      classes.set(id, c);
    } else if (ns && !c.group) c.group = ns;
    return c;
  };
  const addMember = (c, txt) => {
    const sty = txt.trim().match(/^<<(.+)>>$/);
    if (sty) {
      c.stereo = sty[1];
      return;
    }
    const m = parseMember(txt);
    if (!m) return;
    if (m.attr) c.attrs.push(m.attr);
    else c.ops.push(m.op);
  };
  for (const raw of code.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line || line.startsWith('%%') || /^(direction|note)\b/.test(line)) continue;
    if (cur) {
      if (line === '}') cur = null;
      else addMember(cur, line);
      continue;
    }
    let m = line.match(/^namespace\s+(\w+)\s*\{$/);
    if (m) {
      ns = m[1].replace(/_/g, ' ');
      continue;
    }
    if (line === '}') {
      ns = '';
      continue;
    }
    m = line.match(/^class\s+(\w+)\s*\{\s*(.*?)\s*\}$/);
    if (m) {
      const c = ensure(m[1]);
      m[2].split(';').forEach((p) => p.trim() && addMember(c, p));
      continue;
    }
    m = line.match(/^class\s+(\w+)\s*\{$/);
    if (m) {
      cur = ensure(m[1]);
      continue;
    }
    m = line.match(/^class\s+(\w+)\s*$/);
    if (m) {
      ensure(m[1]);
      continue;
    }
    m = line.match(REL);
    if (m) {
      const [, a, ca, op, cb, b, lab] = m;
      ensure(a);
      ensure(b);
      const e = { label: clean(lab) };
      switch (op) {
        case '<|--': Object.assign(e, { from: b, to: a, type: 'Generalization' }); break;
        case '--|>': Object.assign(e, { from: a, to: b, type: 'Generalization' }); break;
        case '<|..': Object.assign(e, { from: b, to: a, type: 'Realization' }); break;
        case '..|>': Object.assign(e, { from: a, to: b, type: 'Realization' }); break;
        case '*--': Object.assign(e, { from: a, to: b, type: 'Association', srcAgg: 2, srcCard: ca, dstCard: cb }); break;
        case '--*': Object.assign(e, { from: b, to: a, type: 'Association', srcAgg: 2, srcCard: cb, dstCard: ca }); break;
        case 'o--': Object.assign(e, { from: a, to: b, type: 'Association', srcAgg: 1, srcCard: ca, dstCard: cb }); break;
        case '--o': Object.assign(e, { from: b, to: a, type: 'Association', srcAgg: 1, srcCard: cb, dstCard: ca }); break;
        case '-->': Object.assign(e, { from: a, to: b, type: 'Association', dir: 'Source -> Destination', srcCard: ca, dstCard: cb }); break;
        case '<--': Object.assign(e, { from: b, to: a, type: 'Association', dir: 'Source -> Destination', srcCard: cb, dstCard: ca }); break;
        case '..>': Object.assign(e, { from: a, to: b, type: 'Dependency', dir: 'Source -> Destination' }); break;
        case '<..': Object.assign(e, { from: b, to: a, type: 'Dependency', dir: 'Source -> Destination' }); break;
        case '..': Object.assign(e, { from: a, to: b, type: 'Dependency' }); break;
        default: Object.assign(e, { from: a, to: b, type: 'Association', srcCard: ca, dstCard: cb });
      }
      edges.push(e);
      continue;
    }
    m = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (m) {
      addMember(ensure(m[1]), m[2]);
      continue;
    }
    warn(where, line);
  }
  const nodes = [...classes.values()].map((c) => {
    const n = { ...c };
    if (!n.attrs.length) delete n.attrs;
    if (!n.ops.length) delete n.ops;
    return n;
  });
  return { type: 'class', title, path, nodes, edges };
}

// ------------------------------------------------------------------ recolección
const kindOf = (code) => code.trim().split(/\s/)[0];
const ucFiles = readdirSync(join(DOCS, '02-iconix', '03-casos-de-uso')).filter((f) => /^UC-\d+/.test(f)).sort();

// 1) Casos de uso y dominio
const s1 = [];
{
  const f = join(DOCS, '02-iconix', '03-casos-de-uso', '00-catalogo.md');
  const b = mermaidBlocks(f).find((x) => kindOf(x.code) === 'flowchart');
  s1.push(useCaseDiagram(b.code, 'catalogo'));
  const d = mermaidBlocks(join(DOCS, '02-iconix', '02-modelo-dominio.md')).find((x) => kindOf(x.code) === 'classDiagram');
  s1.push(classDiagram(d.code, 'modelo-dominio', 'Modelo de dominio (vista global)', ['Modelo de dominio']));
}

// 2) Modelo estático
const s2 = [];
{
  const dir = join(DOCS, '02-iconix', '06-modelo-estatico');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md') && x !== '00-indice.md').sort()) {
    const name = f.replace(/\.md$/, '');
    for (const b of mermaidBlocks(join(dir, f))) {
      if (kindOf(b.code) !== 'classDiagram' || !/^1\./.test(b.heading)) continue;
      s2.push(classDiagram(b.code, `estatico/${name}`, `Clases de diseno - ${name}`, [name]));
    }
  }
}

// 3) Robustez y 4) Secuencia
const s3 = [];
const s4 = [];
for (const f of ucFiles) {
  const id = f.match(/^(UC-\d+)/)[1];
  const slug = f.replace(/^UC-\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ');
  const pkg = `${id} ${slug}`;
  const text = readFileSync(join(DOCS, '02-iconix', '03-casos-de-uso', f), 'utf8');
  const ucTitle = (text.match(/^# (.*)$/m) || [, pkg])[1].replace(/^UC-\d+\s*[·:\-–—]\s*/, '');
  for (const b of mermaidBlocks(join(DOCS, '02-iconix', '03-casos-de-uso', f))) {
    const k = kindOf(b.code);
    if (k === 'flowchart' && /robustez/i.test(b.section)) {
      const sub = /robustez/i.test(b.heading) ? '' : ' - ' + clean(b.heading.replace(/^\d+(\.\d+)*\s*/, ''));
      s3.push(robustnessDiagram(b.code, `${id}/robustez`, `${id} Robustez - ${clean(ucTitle)}${sub}`, [pkg]));
    } else if (k === 'sequenceDiagram') {
      const sub = b.heading.replace(/^\d+(\.\d+)*\s*/, '');
      s4.push(sequenceDiagram(b.code, `${id}/secuencia`, `${id} Secuencia - ${clean(sub)}`, [pkg]));
    }
  }
}

// ------------------------------------------------------------------ emisión
function toJs(data) {
  return JSON.stringify(data).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

const scripts = [
  ['01-casos-de-uso-y-dominio.js', 'Bandada U - 01 Casos de uso y dominio', s1],
  ['02-modelo-estatico.js', 'Bandada U - 02 Modelo estatico', s2],
  ['03-robustez.js', 'Bandada U - 03 Robustez', s3],
  ['04-secuencia.js', 'Bandada U - 04 Secuencia', s4],
];

mkdirSync(OUT, { recursive: true });
for (const [file, title, diagrams] of scripts) {
  const header = `// ${title} (${diagrams.length} diagramas)\nvar SCRIPT_TITLE = ${JSON.stringify(title)};\nvar DIAGRAMS = ${toJs(diagrams)};\n\n`;
  writeFileSync(join(OUT, file), header + runtime);
  const nodes = diagrams.reduce((a, d) => a + d.nodes.length, 0);
  const edges = diagrams.reduce((a, d) => a + d.edges.length, 0);
  console.log(`${file}: ${diagrams.length} diagramas, ${nodes} elementos, ${edges} conectores`);
}
if (issues.length) {
  console.log(`\n${issues.length} lineas no interpretadas:`);
  issues.slice(0, 40).forEach((i) => console.log('  ' + i));
}
