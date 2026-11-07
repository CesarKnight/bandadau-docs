// Captura las pantallas de Bandada U con las credenciales del seed (make seed).
// Requisitos: stack levantado (make up + make seed) y los frontends en dev:
//   app :8081 (pnpm web) · panel :3001 (shell) + :4201 + :4301 (MFEs) · landing :3000
// Uso:
//   CHROME=/ruta/chrome-headless-shell PUPPETEER_DIR=/ruta/con/node_modules node capturas/capturar.mjs [app|panel|landing|all]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'img');
fs.mkdirSync(OUT, { recursive: true });
const puppeteer = createRequire(path.join(process.env.PUPPETEER_DIR, 'x.js'))('puppeteer-core');

const PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Bandada#2026';
const APP = process.env.APP_URL || 'http://localhost:8081';
const PANEL = process.env.PANEL_URL || 'http://localhost:3001';
const LANDING = process.env.LANDING_URL || 'http://localhost:3000';
const which = process.argv[2] || 'all';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: true, args: ['--no-sandbox'] });
const report = [];

async function newPage(kind) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  if (kind === 'mobile') await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  else await p.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1.5 });
  return p;
}

async function shot(p, name, { wait = 2500, full = false } = {}) {
  await sleep(wait);
  // Oculta el indicador de desarrollo de Next.js (esquina inferior izquierda).
  await p.addStyleTag({ content: 'nextjs-portal,[data-nextjs-toast],[data-next-badge-root]{display:none!important}' }).catch(() => {});
  // Quita desplazamientos horizontales residuales de los toques/scroll del script.
  await p.evaluate(() => document.querySelectorAll('*').forEach((e) => { if (e.scrollLeft) e.scrollLeft = 0; })).catch(() => {});
  await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  report.push(name);
  console.log('  ✓', name, '←', p.url());
}

async function clickText(p, text, tag = '*') {
  const ok = await p.evaluate(
    (t, tg) => {
      const els = [...document.querySelectorAll(tg)].filter((e) => (e.innerText || '').trim() === t || (e.getAttribute('aria-label') || '') === t);
      const el = els.at(-1);
      if (el) (el.closest('a,button,[role=button]') || el).click();
      return !!el;
    },
    text,
    tag,
  );
  return ok;
}

async function leftLogin(p, ms = 40000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await sleep(1000);
    try {
      if (!new URL(p.url()).pathname.includes('login')) return true;
    } catch {}
  }
  throw new Error('no salió de /login: ' + p.url());
}

// Navegación del lado del cliente (evita recargar la SPA y perder la sesión en memoria).
async function nav(p, to) {
  await p.evaluate((t) => {
    window.history.pushState({}, '', t);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, to);
}

// Toque real (táctil) sobre el último elemento cuyo texto exacto coincide.
async function tapText(p, text, partial = false) {
  const pt = await p.evaluate((t, part) => {
    const els = [...document.querySelectorAll('[role=button],a,div,span')].filter((e) => {
      const x = (e.innerText || '').trim();
      return part ? x.includes(t) && x.length < t.length + 80 : x === t;
    });
    const el = els.at(-1);
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, text, partial);
  if (!pt) return false;
  await p.touchscreen.tap(pt.x, pt.y);
  return true;
}

// Pestañas inferiores: 0 inicio · 1 eventos · 2 asistente · 3 billetera · 4 perfil
async function tab(p, i) {
  await p.touchscreen.tap([56, 125, 195, 264, 333][i], 806);
}

// Desplaza la lista hasta que aparezca un texto (las listas están virtualizadas).
async function scrollTap(p, text, tries = 12) {
  for (let i = 0; i < tries; i++) {
    if (await tapText(p, text, true)) return true;
    await p.mouse.wheel({ deltaY: 500 }).catch(() => {});
    await p.evaluate(() => document.querySelectorAll('div').forEach((d) => { if (d.scrollHeight > d.clientHeight + 50 && getComputedStyle(d).overflowY !== 'visible') d.scrollTop += 500; }));
    await sleep(700);
  }
  return false;
}

async function back(p) {
  await p.touchscreen.tap(34, 30);
  await sleep(2500);
}

// Menú "…" del perfil (arriba a la derecha) y opción por texto.
async function menu(p, option) {
  await p.touchscreen.tap(357, 28);
  await sleep(1500);
  await tapText(p, option);
}

async function appLogin(p, email) {
  await p.goto(`${APP}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(5000);
  const inputs = await p.$$('input');
  await inputs[0].type(email);
  await inputs[1].type(PASSWORD);
  await tapText(p, 'Entrar');
  await leftLogin(p);
  await sleep(4000);
}

async function app() {
  console.log('App (móvil)');
  // Visitante
  let p = await newPage('mobile');
  await p.goto(`${APP}/welcome`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await shot(p, 'app-01-bienvenida', { wait: 5000 });
  await p.goto(`${APP}/register`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await shot(p, 'app-02-registro', { wait: 3500 });
  await p.goto(`${APP}/verify-email`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await shot(p, 'app-03-verificar-correo', { wait: 3500 });
  await p.browserContext().close();

  // Estudiante: lucia (tiene créditos y entradas en el seed)
  p = await newPage('mobile');
  await appLogin(p, 'lucia@umsa.edu.bo');
  await tab(p, 1);
  await shot(p, 'app-09-eventos', { wait: 5000 });
  // Detalle del evento de pago
  if (await scrollTap(p, 'Taller de Docker para Bandada U')) {
    // A 390 px de ancho la tarjeta de detalle mide 400 px y se corta (defecto de maquetación de la app web,
    // ver informe): se captura con 500 px de ancho para que se vea completa.
    await p.setViewport({ width: 500, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await shot(p, 'app-10-detalle-evento', { wait: 4000 });
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goBack().catch(() => {});
    await sleep(2000);
  } else console.log('  ! no se encontró el evento de pago');
  await tab(p, 3);
  await shot(p, 'app-12-billetera', { wait: 5000 });
  // Perfil → Crear publicación / menú (Mis inscripciones, Mis entradas)
  await tab(p, 4);
  await sleep(3000);
  await tapText(p, 'Crear publicación');
  await shot(p, 'app-07-nueva-publicacion', { wait: 4000 });
  await back(p);
  await menu(p, 'Mis inscripciones');
  await shot(p, 'app-11-inscripciones', { wait: 5000 });
  await back(p);
  await menu(p, 'Mis entradas');
  await shot(p, 'app-13a-mis-entradas', { wait: 5000 });
  if ((await tapText(p, 'Taller de Docker', true)) || (await tapText(p, 'Hackathon', true))) {
    await shot(p, 'app-13b-entrada-qr', { wait: 6000 });
  } else console.log('  ! sin entradas para lucia');
  await p.browserContext().close();

  // Organizador
  p = await newPage('mobile');
  await appLogin(p, 'org@umsa.edu.bo');
  await tab(p, 1);
  await sleep(3000);
  if ((await tapText(p, 'Crear evento')) || (await tapText(p, 'Nuevo evento'))) {
    await sleep(3000);
    const f = await p.$$('input, textarea');
    if (f.length >= 3) {
      await f[0].type('Taller de Docker para Bandada U');
      await f[1].type('Contenedores desde cero: imágenes, redes y Compose.');
      await f[2].type('Auditorio de la Facultad de Ingeniería, UMSA');
      const price = f[f.length - 1];
      await price.evaluate((e) => e.select());
      await price.type('20');
    }
    await shot(p, 'app-18a-crear-evento', { wait: 1500 });
  }
  else {
    console.log('  ! botón de crear evento no encontrado; usando ruta directa');
    await nav(p, `/events/create`);
    await shot(p, 'app-18a-crear-evento', { wait: 4000 });
  }
  await back(p);
  await tab(p, 4);
  await sleep(2500);
  await menu(p, 'Mis entradas');
  await sleep(2500);
  if (await tapText(p, 'Escanear entrada')) await shot(p, 'app-18b-validar-entradas', { wait: 4000 });
  else console.log('  ! no se encontró Escanear entrada');
  await p.browserContext().close();
}

// Clic sobre texto visible atravesando shadow DOM (los MFE son custom elements).
async function clickPierce(p, text) {
  try {
    const h = await p.waitForSelector(`::-p-text(${text})`, { timeout: 8000 });
    await h.click();
    return true;
  } catch {
    console.log('  ! texto no encontrado:', text);
    return false;
  }
}

async function clickLink(p, text) {
  const ok = await p.evaluate((t) => {
    const a = [...document.querySelectorAll('a')].find((x) => (x.innerText || '').trim() === t);
    if (a) a.click();
    return !!a;
  }, text);
  if (!ok) console.log('  ! enlace no encontrado:', text);
  return ok;
}

async function panel() {
  console.log('Panel (escritorio)');
  const p = await newPage('desktop');
  await p.goto(`${PANEL}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await shot(p, 'adm-01-login', { wait: 3000 });
  const inputs = await p.$$('input');
  await inputs[0].type('admin@umsa.edu.bo');
  await inputs[1].type(PASSWORD);
  await p.keyboard.press('Enter');
  await leftLogin(p);
  await sleep(4000);
  await shot(p, 'adm-03-dashboard', { wait: 6000 });
  await clickLink(p, 'Insights');
  await shot(p, 'adm-06a-insights', { wait: 9000 });
  if (await clickPierce(p, 'Respuesta de Bandada U')) await shot(p, 'adm-06b-reporte-generado', { wait: 5000 });
  await clickPierce(p, 'Alertas');
  await shot(p, 'adm-06c-alertas', { wait: 4000 });
  await clickPierce(p, 'Ejecuciones de agentes');
  await shot(p, 'adm-06d-ejecuciones-agentes', { wait: 4000 });
  await clickLink(p, 'SAGAs');
  await shot(p, 'adm-07-sagas', { wait: 7000 });
  await p.browserContext().close();
}

async function landing() {
  console.log('Landing');
  const p = await newPage('desktop');
  await p.goto(`${LANDING}/es`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  // Recorre la página para disparar las animaciones de aparición antes de capturarla completa.
  await sleep(2000);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(350);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  await shot(p, 'lnd-01-landing', { wait: 1500, full: true });
  await p.browserContext().close();
}

try {
  if (which === 'app' || which === 'all') await app();
  if (which === 'panel' || which === 'all') await panel();
  if (which === 'landing' || which === 'all') await landing();
} finally {
  await browser.close();
}
console.log(`${report.length} capturas en ${OUT}`);
