#!/usr/bin/env node
// Prueba los scripts de EA SIN Enterprise Architect: los ejecuta contra una
// simulacion minima de su API de automatizacion y comprueba conteos y sintaxis ES3.
// Uso: node entregable/ea/probar-scripts.mjs
// OJO: esto valida la logica y la sintaxis, no el comportamiento real de EA.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'scripts');
let failed = 0;

function coll(factory, onAdd) {
  const items = [];
  return {
    items,
    get Count() { return items.length; },
    GetAt: (i) => items[i],
    AddNew(name, type) { const o = factory(name, type); items.push(o); onAdd && onAdd(o); return o; },
    Refresh() {},
  };
}

function makeEnv() {
  let nextId = 1;
  const counts = { packages: 0, elements: 0, connectors: 0, diagrams: 0, objects: 0, attrs: 0, methods: 0 };
  const out = [];
  const mkEnd = () => ({ Cardinality: '', Aggregation: 0, Update() {} });
  const mkPackage = (name) => {
    const p = { Name: name, PackageID: nextId++, Update() {} };
    p.Packages = coll(mkPackage, () => counts.packages++);
    p.Elements = coll((n, t) => mkElement(n, t), () => counts.elements++);
    p.Diagrams = coll((n, t) => mkDiagram(n, t), () => counts.diagrams++);
    return p;
  };
  const mkElement = (name, type) => {
    const e = { Name: name, Type: type, ElementID: nextId++, Update() {} };
    e.Attributes = coll((n, t) => ({ Name: n, Type: t, Update() {} }), () => counts.attrs++);
    e.Methods = coll((n, t) => ({ Name: n, ReturnType: t, Update() {} }), () => counts.methods++);
    e.Connectors = coll((n, t) => ({ Name: n, Type: t, SupplierID: 0, ClientEnd: mkEnd(), SupplierEnd: mkEnd(), Update() {} }), () => counts.connectors++);
    return e;
  };
  const mkDiagram = (name, type) => {
    const d = { Name: name, Type: type, DiagramID: nextId++, DiagramGUID: '{x}', Update() {} };
    d.DiagramObjects = coll(() => ({ ElementID: 0, Update() {} }), () => counts.objects++);
    return d;
  };
  const root = mkPackage('Model');
  const Repository = {
    Models: { Count: 1, GetAt: () => root },
    EnableUIUpdates: true,
    RefreshModelView() {},
    ReloadDiagram() {},
    GetProjectInterface: () => ({ LayoutDiagramEx() { return true; } }),
  };
  return { Repository, Session: { Output: (m) => out.push(m), Prompt: (m) => out.push('PROMPT ' + m) }, counts, out };
}

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.js')).sort()) {
  const src = readFileSync(join(DIR, file), 'utf8');
  const problems = [];
  if (/[^\x00-\x7f]/.test(src)) problems.push('contiene caracteres no ASCII');
  if (/=>|\blet\b|\bconst\b|`|\.forEach\(|\.map\(|\.filter\(|\.indexOf\(|JSON\./.test(src.replace(/^\/\/.*$/gm, ''))) problems.push('sintaxis no ES3');

  const env = makeEnv();
  const ctx = vm.createContext({ Repository: env.Repository, Session: env.Session, Math, Date });
  try {
    vm.runInContext(src, ctx);
  } catch (e) {
    problems.push('excepcion: ' + e.message);
  }
  const diagrams = vm.runInContext('DIAGRAMS', ctx);
  const expNodes = diagrams.reduce((a, d) => a + d.nodes.length, 0);
  const expEdges = diagrams.reduce((a, d) => a + d.edges.length, 0);
  if (env.counts.diagrams !== diagrams.length) problems.push(`diagramas ${env.counts.diagrams}/${diagrams.length}`);
  if (env.counts.elements !== expNodes) problems.push(`elementos ${env.counts.elements}/${expNodes}`);
  if (env.counts.connectors !== expEdges) problems.push(`conectores ${env.counts.connectors}/${expEdges}`);
  if (env.counts.objects !== expNodes) problems.push(`objetos de diagrama ${env.counts.objects}/${expNodes}`);
  const avisos = env.out.filter((l) => l.startsWith('AVISO') || l.startsWith('ERROR') || l.startsWith('PROMPT'));
  if (avisos.length) problems.push(...avisos.slice(0, 5));
  console.log(`${problems.length ? 'FALLA' : 'OK   '} ${file}  ${JSON.stringify(env.counts)}`);
  problems.forEach((p) => console.log('      - ' + p));
  if (problems.length) failed++;
}
process.exit(failed ? 1 : 0);
