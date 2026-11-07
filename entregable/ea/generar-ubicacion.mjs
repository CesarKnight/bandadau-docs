#!/usr/bin/env node
// Genera UBICACION-DIAGRAMAS.md: en qué figura y sección del documento Word va cada diagrama de EA.
// Requiere haber construido el documento (node entregable/build.mjs) y el manifiesto
// (node entregable/ea/generar-scripts-ea.mjs). Uso: node entregable/ea/generar-ubicacion.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOC = readFileSync(join(HERE, '..', 'build', 'documento.md'), 'utf8').split('\n');
const manifest = JSON.parse(readFileSync(join(HERE, 'manifiesto.json'), 'utf8'));
const SCALE = 1.6; // igual que build.mjs

// hash -> [{fig, caption, section}]
const NUMBERED = /^(?:(CAP[ÍI]TULO [IVX]+)\.?|(Anexo [A-Z])\.?|(\d+(?:\.\d+)*)\.?)\s+(.*)$/;
const where = new Map();
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
let heading = '';
let numbered = '';
let chapter = 0;
for (const line of DOC) {
  const h = line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    heading = h[2].trim();
    const cap = heading.match(/^CAP[ÍI]TULO ([IVX]+)/);
    if (cap) {
      chapter = ROMAN[cap[1]] || 0;
      numbered = heading;
    } else if (/^Anexo [A-Z]/.test(heading)) {
      chapter = 0;
      numbered = heading;
    } else {
      // solo cuentan los encabezados cuya numeración pertenece al capítulo actual
      // (la numeración local de un UC, p. ej. «2.1 Curso básico», se ignora)
      // y cuyo nivel de encabezado coincide con la profundidad de su número.
      const m = heading.match(/^(\d+(?:\.\d+)+)\.?\s/);
      if (m) {
        const parts = m[1].split('.');
        if (Number(parts[0]) === chapter && parts.length === h[1].length) numbered = heading;
      }
    }
    continue;
  }
  const f = line.match(/^!\[Figura (\d+)\. (.*?)\]\(img\/([0-9a-f]{16})\.png\)/);
  if (f) {
    const list = where.get(f[3]) || [];
    list.push({ fig: Number(f[1]), caption: f[2], section: numbered, sub: heading !== numbered ? heading : '' });
    where.set(f[3], list);
  }
}

const hashOf = (code) => crypto.createHash('sha1').update(`s${SCALE}:${code}`).digest('hex').slice(0, 16);
const esc = (s) => String(s).replace(/\|/g, '\\|');

// Sugerencia para los diagramas que no están en el Word, según el tema del documento de origen.
const sectionLike = (re) => {
  const hit = DOC.find((l) => /^#{1,3}\s/.test(l) && re.test(l));
  return hit ? hit.replace(/^#+\s+/, '') : '';
};
const SUGGEST = [
  [/^UC-\d+ (Robustez|Secuencia)/, 'Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC'],
  [/Despliegue local/, 'Anexo «Guía de levantamiento local» (o 4.6 junto al despliegue en la nube)'],
  [/SAGA Secuencia/, 'Ya cubierto por las secuencias de UC-12 (sección 3.3); opcional en ' + sectionLike(/Integración de componentes/)],
  [/saga|SAGA/, sectionLike(/Integración de componentes/)],
  [/ia-local|ml-dl|automatizacion-n8n|agentes|mcp|idempotencia|eventos-y-mensajeria|observabilidad|microfrontends|graphql|seguridad/i, sectionLike(/Integración de componentes/)],
  [/arquitectura-general|infraestructura|guia-despliegue|docker/i, sectionLike(/Diseño de la arquitectura/)],
  [/ddd|hexagonal|clean-architecture/i, sectionLike(/Diagrama de clases UML/)],
  [/testing-strategy/i, sectionLike(/Plan de pruebas/)],
  [/design-tokens|i18n/i, sectionLike(/Diseño de interfaces/)],
  [/metodologia|roadmap/i, sectionLike(/Aspectos generales|ICONIX/i)],
];
const suggest = (d) => {
  const key = `${d.title} ${d.path.join(' ')}`;
  for (const [re, sec] of SUGGEST) if (re.test(key) && sec) return sec;
  return 'Anexo opcional «Diagramas complementarios»';
};

const rows = new Map();
let inDoc = 0;
for (const d of manifest) {
  const hits = where.get(hashOf(d.code)) || [];
  if (hits.length) inDoc++;
  const list = rows.get(d.script) || [];
  list.push({ d, hits });
  rows.set(d.script, list);
}

let md = `# Dónde va cada diagrama en el documento

Guía para quien arme el documento con los diagramas de Enterprise Architect. Para cada diagrama
indica **la figura y la sección del Word** (\`Bandada-U-Documento-Entregable.docx\`) donde aparece, o
dónde ponerlo si el documento no lo incluye. Se genera con \`node entregable/ea/generar-ubicacion.mjs\`
a partir del documento construido y del manifiesto de los scripts, así que sigue la numeración real.

Cómo usarla: ejecuta el script de EA, abre el diagrama con el **nombre exacto** de la columna «Diagrama en EA»,
expórtalo como imagen (clic derecho > *Save as Image* o \`Ctrl+Shift+...\` según versión) y sustituye o agrega la
figura en la sección indicada. Los nombres de paquete son los que crea el script en el *Project Browser*.

**Resumen:** ${manifest.length} diagramas en EA; **${inDoc}** aparecen en el documento (con figura y sección) y **${manifest.length - inDoc}** no
están en el Word (columna «Sugerencia»). La numeración de figuras puede moverse si se agregan o quitan
figuras: vuelve a generar este archivo después de reconstruir el documento.

`;

const names = {
  '01-casos-de-uso-y-dominio.js': '01 · Casos de uso y dominio',
  '02-modelo-estatico.js': '02 · Modelo estático (clases de diseño)',
  '03-robustez.js': '03 · Diagramas de robustez',
  '04-secuencia.js': '04 · Diagramas de secuencia',
  '05-arquitectura-y-despliegue.js': '05 · Arquitectura y despliegue',
  '06-saga.js': '06 · SAGA',
  '07-otros-diagramas.js': '07 · Otros diagramas',
};

for (const [script, list] of rows) {
  const count = list.filter((r) => r.hits.length).length;
  md += `## ${names[script] || script}\n\nScript: \`scripts/${script}\` · paquete EA: «${list[0].d.scriptTitle}» · ${count} de ${list.length} diagramas están en el documento.\n\n`;
  md += '| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |\n|---|---|---|---|\n';
  for (const { d, hits } of list) {
    const pkg = d.path.join(' / ');
    if (hits.length) {
      md += `| ${esc(d.title)} | ${esc(pkg)} | ${hits.map((h) => `Figura ${h.fig}`).join(', ')} | ${hits.map((h) => esc(h.section) + (h.sub ? ` (subsección: ${esc(h.sub)})` : '')).join(' · ')} |\n`;
    } else {
      md += `| ${esc(d.title)} | ${esc(pkg)} | — (no está en el Word) | ${esc(suggest(d))} |\n`;
    }
  }
  md += '\n';
}

md += `## No importado a EA

- Fragmentos combinados reales de secuencia (\`alt\`, \`opt\`, \`loop\`): quedan como prefijo del mensaje.
- Diagrama de Gantt de \`docs/06-plan/roadmap-y-sprints.md\`: EA no lo modela como diagrama.
`;

writeFileSync(join(HERE, 'UBICACION-DIAGRAMAS.md'), md);
console.log(`UBICACION-DIAGRAMAS.md: ${manifest.length} diagramas, ${inDoc} en el documento`);
