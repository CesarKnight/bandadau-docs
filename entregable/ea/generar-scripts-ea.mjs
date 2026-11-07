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
const used = new Set();

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
  [/^\{\{"?(.*?)"?\}\}$/, 'hex'],
  [/^\{"?(.*?)"?\}$/, 'rhombus'],
  [/^\["?(.*?)"?\]$/, 'rect'],
];

function parseEndpoint(txt) {
  const m = txt.trim().match(/^(\w+)\s*(.*)$/);
  if (!m) return null;
  if (!m[2]) return { id: m[1] };
  for (const [re, shape] of SHAPES) {
    const s = m[2].match(re);
    if (s) return { id: m[1], shape, label: clean(s[1]), raw: s[1] };
  }
  return null;
}

function parseFlowchart(code, where) {
  const nodes = new Map();
  const edges = [];
  const groups = [];
  const groupDefs = [];
  const stack = [];
  const idStack = [];
  const upsert = (ep) => {
    if (!ep) return null;
    let n = nodes.get(ep.id);
    if (!n) {
      n = { id: ep.id, group: stack.length ? stack[stack.length - 1] : '', groupId: idStack.length ? idStack[idStack.length - 1] : '' };
      nodes.set(ep.id, n);
    }
    if (ep.label) {
      n.shape = ep.shape;
      n.label = ep.label;
      n.raw = ep.raw;
    }
    return n;
  };
  for (const raw of code.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line || line.startsWith('%%') || /^(direction|classDef|class |style|linkStyle)\b/.test(line)) continue;
    const sg = line.match(/^subgraph\s+(\w+)(?:\s*\["?(.*?)"?\])?$/);
    if (sg) {
      const name = clean(sg[2] || sg[1].replace(/_/g, ' '));
      groupDefs.push({ id: sg[1], name, parent: idStack.length ? idStack[idStack.length - 1] : '' });
      stack.push(name);
      idStack.push(sg[1]);
      groups.push(name);
      continue;
    }
    if (line === 'end') {
      stack.pop();
      idStack.pop();
      continue;
    }
    if (/(<-->|-->|-\.[^.>]*\.->|-\.->|==>|---|-\.[^.>]*\.-)/.test(line)) {
      const parts = line.split(/\s*(<-->|--\s+(?:\"[^\"]*\"|[^\s\"][^>]*?)\s+-->|-->|-\.[^.>]*\.->|-\.->|==>|---|-\.[^.>]*\.-)\s*(?:\|([^|]*)\|\s*)?/);
      // parts: [ep0, arrow1, label1, ep1, arrow2, label2, ep2...]
      const groupsOfEp = [];
      for (let i = 0; i < parts.length; i += 3) {
        const eps = parts[i].split(/\s+&\s+/).map(parseEndpoint);
        if (eps.some((e) => !e)) {
          warn(where, line);
          groupsOfEp.length = 0;
          break;
        }
        groupsOfEp.push(eps.map(upsert));
      }
      for (let i = 0; i + 1 < groupsOfEp.length; i++) {
        const arrow = parts[3 * i + 1];
        const dotted = arrow.match(/^-\.(.+)\.-+>?$/);
        const dashed = arrow.match(/^--\s+(.+?)\s+-->$/);
        const label = clean(parts[3 * i + 2] || (dotted ? dotted[1] : '') || (dashed ? dashed[1] : ''));
        for (const a of groupsOfEp[i])
          for (const b of groupsOfEp[i + 1]) edges.push({ from: a.id, to: b.id, label, both: arrow === '<-->', dashed: arrow.startsWith('-.') });
      }
      continue;
    }
    const ep = parseEndpoint(line);
    if (ep && ep.label) upsert(ep);
    else warn(where, line);
  }
  return { nodes: [...nodes.values()], edges, groups, groupDefs };
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
  let noteN = 0;
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
    m = line.match(/^Note\s+(?:over|left of|right of)\s+([\w, ]+?)\s*:\s*(.*)$/i);
    if (m) {
      const nid = `note:${++noteN}`;
      nodes.push({ id: nid, kind: 'note', name: '', notes: clean(m[2]) });
      const target = m[1].split(',')[0].trim();
      if (byId.has(target)) edges.push({ from: nid, to: target, type: 'NoteLink' });
      continue;
    }
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



// Distribución anidada compartida (arquitectura, despliegue y estados).
// roots: [{id, isGroup, children, w?, h?}] -> devuelve los elementos ordenados (grupos primero)
// con x, y, w, h calculados.
function layoutItems(roots, { W, H, GAP, PAD, HEAD, topCols = 0 }) {
  const measure = (it) => {
    if (!it.isGroup) return Object.assign(it, { w: it.w || W, h: it.h || H });
    it.children.forEach(measure);
    const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(it.children.length))));
    it.cols = cols;
    const rows = Math.ceil(it.children.length / cols);
    const colW = [], rowH = [];
    it.children.forEach((c, i) => {
      colW[i % cols] = Math.max(colW[i % cols] || 0, c.w);
      rowH[Math.floor(i / cols)] = Math.max(rowH[Math.floor(i / cols)] || 0, c.h);
    });
    it.colW = colW;
    it.rowH = rowH;
    it.w = PAD * 2 + colW.reduce((a, b) => a + b, 0) + GAP * (cols - 1);
    it.h = HEAD + PAD + rowH.reduce((a, b) => a + b, 0) + GAP * (rows - 1);
    return it;
  };
  const place = (it, x, y) => {
    it.x = x;
    it.y = y;
    if (!it.isGroup) return;
    let cy = y + HEAD;
    for (let r = 0; r * it.cols < it.children.length; r++) {
      let cx = x + PAD;
      for (let c = 0; c < it.cols; c++) {
        const child = it.children[r * it.cols + c];
        if (!child) break;
        place(child, cx, cy);
        cx += it.colW[c] + GAP;
      }
      cy += it.rowH[r] + GAP;
    }
  };
  roots.forEach(measure);
  const cols = topCols || Math.min(4, Math.max(1, Math.ceil(Math.sqrt(roots.length))));
  const colW = [], rowH = [];
  roots.forEach((c, i) => {
    colW[i % cols] = Math.max(colW[i % cols] || 0, c.w);
    rowH[Math.floor(i / cols)] = Math.max(rowH[Math.floor(i / cols)] || 0, c.h);
  });
  let cy = 20;
  for (let r = 0; r * cols < roots.length; r++) {
    let cx = 20;
    for (let c = 0; c < cols; c++) {
      const it = roots[r * cols + c];
      if (!it) break;
      place(it, cx, cy);
      cx += colW[c] + GAP * 2;
    }
    cy += rowH[r] + GAP * 2;
  }
  const ordered = [];
  const walk = (list, groupsOnly) => list.forEach((it) => {
    if (!!it.isGroup === groupsOnly) ordered.push(it);
    if (it.isGroup) walk(it.children, groupsOnly);
  });
  walk(roots, true);
  walk(roots, false);
  return ordered;
}

const posOf = (it) => `l=${it.x};r=${it.x + it.w};t=-${it.y};b=-${it.y + it.h};`;

// ------------------------------------------------------------------ estados
function stateDiagram(code, where, title, path) {
  const items = new Map();
  const edges = [];
  const stack = [];
  const scope = () => (stack.length ? stack[stack.length - 1] : '');
  const mk = (id, extra) => {
    let it = items.get(id);
    if (!it) {
      it = { id, kind: 'state', name: id, parent: scope(), children: [] };
      items.set(id, it);
    }
    return Object.assign(it, extra || {});
  };
  const end = (tok, role) => {
    if (tok !== '[*]') return mk(tok).id;
    const id = `${role}:${scope() || 'top'}`;
    return mk(id, role === 'init' ? { kind: 'initial', name: '', w: 30, h: 30 } : { kind: 'final', name: '', w: 30, h: 30 }).id;
  };
  let inNote = false;
  let noteFor = null;
  for (const raw of code.split('\n').slice(1)) {
    const line = raw.trim();
    if (!line || line.startsWith('%%') || /^direction\b/.test(line)) continue;
    if (inNote) {
      if (/^end note\b/.test(line)) inNote = false;
      else noteFor.notes = (noteFor.notes ? noteFor.notes + ' ' : '') + clean(line);
      continue;
    }
    if (/^note\b/.test(line)) {
      const nm = line.match(/^note\s+(?:left of|right of|over)\s+(\w+)\s*(?::\s*(.*))?$/);
      if (nm) {
        const nid = `note:${items.size}`;
        const target = mk(nm[1]).id;
        noteFor = mk(nid, { kind: 'note', name: '', w: 170, h: 70, notes: nm[2] ? clean(nm[2]) : '' });
        edges.push({ from: nid, to: target, type: 'NoteLink' });
        if (!nm[2]) inNote = true;
      }
      continue;
    }
    let m = line.match(/^state\s+(\w+)\s*\{$/);
    if (m) {
      mk(m[1], { isGroup: true });
      stack.push(m[1]);
      continue;
    }
    if (line === '}') {
      stack.pop();
      continue;
    }
    m = line.match(/^state\s+"(.*)"\s+as\s+(\w+)$/);
    if (m) {
      mk(m[2], { name: clean(m[1]) });
      continue;
    }
    m = line.match(/^(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)\s*(?::\s*(.*))?$/);
    if (m) {
      const from = end(m[1], 'init');
      const to = end(m[2], 'final');
      edges.push({ from, to, type: 'StateFlow', label: clean(m[3]), dir: 'Source -> Destination' });
      continue;
    }
    warn(where, line);
  }
  const roots = [];
  for (const it of items.values()) (it.parent && items.get(it.parent) ? items.get(it.parent).children : roots).push(it);
  const ordered = layoutItems(roots, { W: 190, H: 60, GAP: 40, PAD: 30, HEAD: 36 });
  const nodes = ordered.map((it) => {
    const n = { id: it.id, kind: it.kind, name: it.name, pos: posOf(it) };
    if (it.parent && items.get(it.parent)) n.parent = it.parent;
    if (it.notes) n.notes = it.notes;
    return n;
  });
  return { type: 'state', title, path, nodes, edges };
}

// ------------------------------------------------------------------ arquitectura / despliegue
// mode 'contenedores' (grupos = Boundary) | 'despliegue' (grupos = Node) | 'contextos'
function archDiagram(code, where, title, path, mode) {
  const g = parseFlowchart(code, where);
  const W = 190, H = 70, GAP = 24, PAD = 24, HEAD = 34;
  const groupKind = mode === 'despliegue' ? 'node' : 'boundary';
  const items = new Map(); // id -> {id, kind, name, notes, stereo, children:[], parent}
  for (const gd of g.groupDefs) {
    items.set('g:' + gd.id, { id: 'g:' + gd.id, kind: groupKind, name: gd.name, stereo: mode === 'despliegue' ? 'execution environment' : 'subsystem', parent: gd.parent ? 'g:' + gd.parent : '', isGroup: true, children: [] });
  }
  for (const n of g.nodes) {
    const lines = (n.raw || n.label || n.id).split(/<br\s*\/?>/i).map((x) => x.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
    const it = { id: n.id, kind: 'component', name: lines[0], notes: lines.slice(1).join('\n') || undefined, parent: n.groupId ? 'g:' + n.groupId : '', children: [] };
    if (n.shape === 'cyl') it.stereo = 'datastore';
    if (n.shape === 'hex') it.stereo = 'message broker';
    if (n.shape === 'rhombus') it.stereo = 'decision';
    if (mode === 'contextos') it.stereo = 'bounded context';
    items.set(n.id, it);
  }
  const roots = [];
  for (const it of items.values()) (it.parent && items.get(it.parent) ? items.get(it.parent).children : roots).push(it);
  const ordered = layoutItems(roots, { W, H, GAP, PAD, HEAD, topCols: mode === 'contextos' ? 3 : 0 });
  const nodes = ordered.map((it) => {
    const n = { id: it.id, kind: it.kind, name: it.name, pos: posOf(it) };
    if (it.stereo) n.stereo = it.stereo;
    if (it.notes) n.notes = it.notes;
    return n;
  });
  const known = new Set(nodes.map((n) => n.id));
  const edges = g.edges
    .filter((e) => known.has(e.from) && known.has(e.to))
    .map((e) => ({
      from: e.from,
      to: e.to,
      type: mode === 'contextos' ? 'Dependency' : 'Association',
      label: e.label,
      dir: e.both ? 'Bi-Directional' : 'Source -> Destination',
    }));
  return { type: 'arch', title, path, nodes, edges };
}


// Etiqueta cada diagrama con el Mermaid de origen (para el manifiesto de ubicación).
for (const name of ['robustnessDiagram', 'useCaseDiagram', 'sequenceDiagram', 'classDiagram', 'archDiagram', 'stateDiagram']) {
  const fn = { robustnessDiagram, useCaseDiagram, sequenceDiagram, classDiagram, archDiagram, stateDiagram }[name];
  const wrapped = (code, ...rest) => Object.assign(fn(code, ...rest), { code: code.replace(/\n$/, '') });
  switch (name) {
    case 'robustnessDiagram': robustnessDiagram = wrapped; break;
    case 'useCaseDiagram': useCaseDiagram = wrapped; break;
    case 'sequenceDiagram': sequenceDiagram = wrapped; break;
    case 'classDiagram': classDiagram = wrapped; break;
    case 'archDiagram': archDiagram = wrapped; break;
    case 'stateDiagram': stateDiagram = wrapped; break;
  }
}

// ------------------------------------------------------------------ recolección
const kindOf = (code) => code.trim().split(/\s/)[0];
const ucFiles = readdirSync(join(DOCS, '02-iconix', '03-casos-de-uso')).filter((f) => /^UC-\d+/.test(f)).sort();

// 1) Casos de uso y dominio
const s1 = [];
{
  const f = join(DOCS, '02-iconix', '03-casos-de-uso', '00-catalogo.md');
  const b = mermaidBlocks(f).find((x) => kindOf(x.code) === 'flowchart');
  used.add(b.code);
  s1.push(useCaseDiagram(b.code, 'catalogo'));
  const d = mermaidBlocks(join(DOCS, '02-iconix', '02-modelo-dominio.md')).find((x) => kindOf(x.code) === 'classDiagram');
  used.add(d.code);
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
      used.add(b.code);
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
      used.add(b.code);
      const sub = /robustez/i.test(b.heading) ? '' : ' - ' + clean(b.heading.replace(/^\d+(\.\d+)*\s*/, ''));
      s3.push(robustnessDiagram(b.code, `${id}/robustez`, `${id} Robustez - ${clean(ucTitle)}${sub}`, [pkg]));
    } else if (k === 'sequenceDiagram') {
      used.add(b.code);
      const sub = b.heading.replace(/^\d+(\.\d+)*\s*/, '');
      s4.push(sequenceDiagram(b.code, `${id}/secuencia`, `${id} Secuencia - ${clean(sub)}`, [pkg]));
    }
  }
}


// 5) Arquitectura y despliegue
const s5 = [];
{
  const pick = (file, sectionRe, n = 0) => {
    const text = readFileSync(join(DOCS, file), 'utf8');
    const m = text.match(sectionRe);
    if (!m) throw new Error(`sección no encontrada: ${file} ${sectionRe}`);
    const rest = text.slice(m.index);
    const blocks = [...rest.matchAll(/```mermaid\n([\s\S]*?)```/g)].filter((b) => kindOf(b[1]) === 'flowchart');
    used.add(blocks[n][1]);
    return blocks[n][1];
  };
  s5.push(archDiagram(pick('03-arquitectura/arquitectura-general.md', /^## 2\. Contenedores/m), 'arq/contenedores', 'Vista de contenedores (arquitectura)', ['Arquitectura'], 'contenedores'));
  s5.push(archDiagram(pick('03-arquitectura/arquitectura-general.md', /^## 3\. Mapa de contextos/m), 'arq/contextos', 'Mapa de contextos (DDD estrategico)', ['Arquitectura'], 'contextos'));
  s5.push(archDiagram(pick('05-infraestructura/infraestructura.md', /^### 2\.1 Vista general/m), 'desp/local', 'Despliegue local (Docker Compose)', ['Despliegue'], 'despliegue'));
  s5.push(archDiagram(pick('05-infraestructura/infraestructura.md', /^### 4\.6 /m), 'desp/nube', 'Despliegue en la nube (AWS + Azure + GCP con Tailscale)', ['Despliegue'], 'despliegue'));
}

// 6) SAGA
const s6 = [];
{
  const f = '03-arquitectura/saga-inscripcion-evento.md';
  for (const b of mermaidBlocks(join(DOCS, f))) {
    const k = kindOf(b.code);
    const t = clean(b.heading.replace(/^\d+(\.\d+)*\.?\s*/, '').replace(/`/g, ''));
    if (k === 'sequenceDiagram' || k === 'stateDiagram-v2') used.add(b.code);
    if (k === 'sequenceDiagram') s6.push(sequenceDiagram(b.code, 'saga/secuencia', `SAGA Secuencia - ${t}`, ['Secuencias']));
    else if (k === 'stateDiagram-v2') s6.push(stateDiagram(b.code, 'saga/estados', `SAGA Estados - ${t}`, ['Estados']));
  }
  for (const b of mermaidBlocks(join(DOCS, '02-iconix', '03-casos-de-uso', 'UC-12-inscribirse-evento.md'))) {
    if (kindOf(b.code) !== 'stateDiagram-v2') continue;
    used.add(b.code);
    s6.push(stateDiagram(b.code, 'uc12/estados', `UC-12 Estados - ${clean(b.heading.replace(/`/g, ''))}`, ['Estados UC-12']));
  }
}

// 7) Resto de diagramas de la documentación (los que aún no se usaron)
const s7 = [];
{
  const walkDocs = (dir, out = []) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const f = join(dir, e.name);
      if (e.isDirectory()) walkDocs(f, out);
      else if (e.name.endsWith('.md')) out.push(f);
    }
    return out;
  };
  const skipped = [];
  for (const f of walkDocs(DOCS).sort()) {
    const rel = f.slice(DOCS.length + 1);
    const base = rel.replace(/\.md$/, '').replace(/^.*\//, '');
    const dir = rel.includes('/') ? rel.split('/')[0] : 'raiz';
    const pkg = [dir.replace(/^\d+-/, ''), base];
    for (const b of mermaidBlocks(f)) {
      if (used.has(b.code)) continue;
      const k = kindOf(b.code);
      const t = clean(b.heading.replace(/`/g, '')) || base;
      const title = `${base} - ${t}`.slice(0, 120);
      const where = `${rel}`;
      if (k === 'flowchart' || k === 'graph') s7.push(archDiagram(b.code, where, title, pkg, 'contenedores'));
      else if (k === 'sequenceDiagram') s7.push(sequenceDiagram(b.code, where, title, pkg));
      else if (k === 'stateDiagram-v2') s7.push(stateDiagram(b.code, where, title, pkg));
      else if (k === 'classDiagram') s7.push(classDiagram(b.code, where, title, pkg));
      else skipped.push(`${rel} (${k}): ${t}`);
      used.add(b.code);
    }
  }
  skipped.forEach((x) => issues.push(`sin equivalente en EA, omitido: ${x}`));
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
  ['05-arquitectura-y-despliegue.js', 'Bandada U - 05 Arquitectura y despliegue', s5],
  ['06-saga.js', 'Bandada U - 06 SAGA', s6],
  ['07-otros-diagramas.js', 'Bandada U - 07 Otros diagramas', s7],
];

mkdirSync(OUT, { recursive: true });
const manifest = [];
for (const [file, title, withCode] of scripts) {
  const diagrams = withCode.map(({ code, ...d }) => d);
  withCode.forEach((d) => manifest.push({ script: file, scriptTitle: title, title: d.title, path: d.path, type: d.type, code: d.code }));
  const header = `// ${title} (${diagrams.length} diagramas)\nvar SCRIPT_TITLE = ${JSON.stringify(title)};\nvar DIAGRAMS = ${toJs(diagrams)};\n\n`;
  writeFileSync(join(OUT, file), header + runtime);
  const nodes = diagrams.reduce((a, d) => a + d.nodes.length, 0);
  const edges = diagrams.reduce((a, d) => a + d.edges.length, 0);
  console.log(`${file}: ${diagrams.length} diagramas, ${nodes} elementos, ${edges} conectores`);
}
writeFileSync(join(HERE, 'manifiesto.json'), JSON.stringify(manifest, null, 1));
if (issues.length) {
  console.log(`\n${issues.length} lineas no interpretadas:`);
  issues.slice(0, 40).forEach((i) => console.log('  ' + i));
}
