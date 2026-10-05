/* ============================================================================
 * HeraUEBA · verificación automatizada del prototipo
 * ============================================================================
 *
 * Ejecuta dos suites sobre el prototipo real en Chromium headless:
 *
 *   1. COMPORTAMIENTO — flujos de negocio, RBAC, BR-001/BR-002, densidad.
 *   2. PRESENTACIÓN  — contraste WCAG sobre el DOM renderizado, tamaño de los
 *                      objetivos táctiles, texto por debajo de 11px, desbordes.
 *
 * Uso:
 *   npm install puppeteer-core        (una vez)
 *   node verificar.js
 *
 * Sale con código 1 si algo falla, para poder engancharlo a un pipeline.
 * Las capturas se escriben en ./capturas/.
 *
 * Gotchas de Puppeteer que ya están resueltas aquí:
 *   · Un goto que sólo cambia el hash resuelve ANTES de que corra el
 *     hashchange, así que hay que dar un margen de asentamiento después.
 *   · Los checkboxes se miden por su <label>, que es el objetivo real (SC 2.5.8).
 *   · Un borde de tarjeta decorativo no necesita 3:1; sólo los controles.
 * ==========================================================================*/

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, 'prototype');
const URL = 'file://' + path.join(ROOT, 'index.html');
const OUT = path.join(__dirname, 'capturas');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

const ROUTES = [
  ['dashboard', '#/dashboard'],
  ['alerta', '#/alerta/INC-2026-0417'],
  ['whitelist', '#/whitelist'],
  ['historial', '#/historial?u=mg.ramirez'],
  ['br002', '#/error-unidad-critica']
];

const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const settle = ms => new Promise(r => setTimeout(r, ms));

/* ==========================================================================
 * Auditoría de presentación: corre dentro de la página
 * ========================================================================== */
function presentacion() {
  const lum = c => {
    const f = v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const parse = s => {
    const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const ratio = (a, b) => {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  /* Fondo efectivo: sube por el árbol hasta el primer color opaco. */
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.9) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const out = { contraste: [], tap: [], microtexto: [], clip: [] };
  const sel = 'p,span,a,button,h1,h2,h3,h4,li,td,th,label,small,strong,em,div';

  document.querySelectorAll(sel).forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const o = getComputedStyle(el);
    if (o.visibility === 'hidden' || o.display === 'none') return;

    const cls = (el.className || '').toString().slice(0, 40);
    const texto = (el.textContent || '').trim().slice(0, 40);
    /* Sólo nodos con texto propio: si no, el padre ya auditó el color. */
    const tieneTexto = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length);
    if (!tieneTexto) return;

    const fg = parse(o.color);
    if (fg && fg.a > 0.5) {
      const size = parseFloat(o.fontSize);
      const weight = parseInt(o.fontWeight, 10) || 400;
      const grande = size >= 24 || (size >= 18.66 && weight >= 700);
      /* WCAG 1.4.3 exime el texto de un componente inactivo. Aquí se le
         aplica un listón más estricto que el de la norma: 3:1. La razón es
         de producto, no de conformidad: el diseño exige que un botón
         deshabilitado vaya acompañado de una línea que explique el motivo
         del bloqueo (rol insuficiente, unidad crítica). Si la etiqueta no
         se lee, esa explicación no llega. */
      const inactivo = el.disabled === true || el.getAttribute('aria-disabled') === 'true'
        || !!el.closest('[disabled],[aria-disabled="true"]');
      const need = inactivo ? 3 : (grande ? 3 : 4.5);
      const cr = ratio(fg, bgOf(el));
      if (cr < need) out.contraste.push({ c: cls || el.tagName.toLowerCase(), txt: texto, size: Math.round(size), cr: +cr.toFixed(2), need, inactivo });
    }
    if (parseFloat(o.fontSize) < 11) out.microtexto.push({ c: cls, size: o.fontSize, txt: texto });
  });

  /* Objetivos táctiles: para checkbox/radio el objetivo real es su <label>.
     Umbral 24×24 = SC 2.5.8 (AA). */
  document.querySelectorAll('button,a[href],input,select,[role="button"]').forEach(el => {
    let box = el;
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
      const lab = el.closest('label');
      if (lab) box = lab;
    }
    const r = box.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.height < 24 || r.width < 24) {
      out.tap.push({ c: (box.className || '').toString().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), txt: (box.textContent || '').trim().slice(0, 30) });
    }
  });

  /* Contenido cortado por un overflow:hidden sin scroll posible. */
  document.querySelectorAll(sel).forEach(el => {
    if (getComputedStyle(el).overflowY !== 'hidden') return;
    if (el.clientHeight <= 0) return;
    if (el.scrollHeight - el.clientHeight > 3) {
      out.clip.push({ c: (el.className || '').toString().slice(0, 40), sh: el.scrollHeight, ch: el.clientHeight });
    }
  });

  out.docSW = document.documentElement.scrollWidth;
  out.docCW = document.documentElement.clientWidth;
  return out;
}

/* ========================================================================== */

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none', '--allow-file-access-from-files']
  });

  const problems = [];
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') problems.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => problems.push('PAGEERROR: ' + e.message));

  /* ---------------------------------------------------------------- *
   * 1 · COMPORTAMIENTO
   * ---------------------------------------------------------------- */
  console.log('=== 1 · COMPORTAMIENTO ===');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  /* 1.1 · Sin desborde horizontal ni una sola acción primaria por vista. */
  for (const [name, hash] of ROUTES) {
    await page.goto(URL + hash, { waitUntil: 'load' });
    await settle(260);
    const r = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      primarios: document.querySelectorAll('.btn--primary:not([disabled])').length
    }));
    console.log(`  ${name.padEnd(11)} primarios=${r.primarios}  overflowX=${r.sw}/${r.cw}`);
    if (r.sw > r.cw) problems.push(`OVERFLOW ${name}: ${r.sw} > ${r.cw}`);
    if (r.primarios > 1) problems.push(`${name}: ${r.primarios} acciones primarias (máx. 1)`);
    await page.screenshot({ path: `${OUT}/desktop-${name}.png` });
  }

  /* 1.2 · FR-001 · la zona crítica completa cabe sin scroll a 1440×900. */
  await page.goto(URL + '#/dashboard', { waitUntil: 'load' });
  await settle(260);
  const fold = await page.evaluate(() => {
    const card = document.querySelector('[aria-labelledby="zonaCritica"]');
    return {
      n: document.querySelectorAll('[aria-labelledby="zonaCritica"] tbody tr').length,
      head: card ? Math.round(card.getBoundingClientRect().bottom) : 9999,
      viewport: window.innerHeight
    };
  });
  console.log('  fold dashboard:', JSON.stringify(fold));
  if (!fold.n) problems.push('FOLD: no se encontraron alertas críticas en el dashboard');
  else if (fold.head > fold.viewport) problems.push(`FOLD: la zona crítica exige scroll (${fold.head} > ${fold.viewport})`);

  /* 1.3 · FR-006 · el modal de aislamiento pasa por dos pasos. */
  await page.goto(URL + '#/alerta/INC-2026-0417', { waitUntil: 'load' });
  await settle(260);
  await page.click('[data-action="try-isolate"]');
  await settle(220);
  const paso1 = await page.evaluate(() => ({
    open: !!document.querySelector('.modal'),
    title: (document.querySelector('#mdTitle') || {}).textContent || ''
  }));
  console.log('  paso1:', JSON.stringify(paso1));
  if (!paso1.open) problems.push('AISLAMIENTO: el modal del paso 1 no abrió');
  await page.screenshot({ path: `${OUT}/flow-modal-paso1.png` });

  /* Continuar sin rellenar los requisitos no debe avanzar de paso. */
  await page.click('[data-action="iso-next"]');
  await settle(220);
  const seQueda = await page.evaluate(() => !!document.querySelector('#mReason'));
  if (!seQueda) problems.push('AISLAMIENTO: el modal avanzó sin motivo ni re-autenticación');
  await page.screenshot({ path: `${OUT}/flow-modal-paso1-errores.png` });

  await page.type('#mReason', 'Credencial comprometida confirmada: 14 intentos fallidos desde ASN 60729 y acceso exitoso posterior.');
  await page.type('#mReauth', 'demo-pass-2026');
  await page.click('#mNotify');
  await settle(120);
  await page.click('[data-action="iso-next"]');
  await settle(220);
  const paso2 = await page.evaluate(() => ({
    confirm: !!document.querySelector('#mConfirm'),
    bloqueado: (document.querySelector('[data-action="iso-confirm"]') || {}).disabled === true
  }));
  console.log('  paso2:', JSON.stringify(paso2));
  if (!paso2.confirm) problems.push('AISLAMIENTO: el paso 2 no pide palabra de confirmación');
  if (!paso2.bloqueado) problems.push('AISLAMIENTO: el paso 2 no bloquea la acción destructiva sin confirmar');
  await page.screenshot({ path: `${OUT}/flow-modal-paso2.png` });

  /* 1.4 · FR-005 · confirmar aísla y redirige al historial con el estado nuevo. */
  await page.type('#mConfirm', 'aislar');
  await settle(150);
  const habilitado = await page.evaluate(() => document.querySelector('[data-action="iso-confirm"]').disabled === false);
  if (!habilitado) problems.push('AISLAMIENTO: la palabra correcta no habilita el botón');

  await page.click('[data-action="iso-confirm"]');
  await settle(320);
  const aislado = await page.evaluate(() => ({
    hash: location.hash,
    aislada: !!document.querySelector('.badge--outline-critical')
  }));
  console.log('  tras aislar:', JSON.stringify(aislado));
  if (!/historial/.test(aislado.hash)) problems.push('AISLAMIENTO: tras confirmar no se redirige al historial');
  if (!aislado.aislada) problems.push('AISLAMIENTO: la cuenta no muestra el estado AISLADA');

  /* 1.5 · BR-002 · una cuenta de unidad crítica no se puede aislar. */
  await page.goto(URL + '#/alerta/INC-2026-0418', { waitUntil: 'load' });
  await settle(260);
  await page.click('[data-action="try-isolate"]');
  await settle(220);
  const br002 = await page.evaluate(() => ({
    title: (document.querySelector('#mdTitle') || {}).textContent || '',
    insignia: (document.querySelector('.modal .badge--outline-critical') || {}).textContent || ''
  }));
  console.log('  br002:', JSON.stringify(br002));
  if (!/unidad crítica/i.test(br002.title)) problems.push('BR-002: el modal de unidad crítica no se mostró');
  if (!/BR-002/.test(br002.insignia)) problems.push('BR-002: falta la insignia BR-002');
  await page.screenshot({ path: `${OUT}/flow-br002.png` });

  /* 1.6 · NFR-003 · el rol Junior no puede aislar. */
  await page.goto(URL + '#/alerta/INC-2026-0417', { waitUntil: 'load' });
  await settle(260);
  await page.click('.seg__btn[data-role="junior"]');
  await settle(220);
  const junior = await page.evaluate(() => ({
    disabled: (document.querySelector('[data-action="try-isolate"]') || {}).disabled === true,
    ayuda: (document.querySelector('.hint') || {}).textContent || ''
  }));
  console.log('  junior:', JSON.stringify({ disabled: junior.disabled, ayuda: junior.ayuda.slice(0, 56) }));
  if (!junior.disabled) problems.push('RBAC: el botón de aislamiento sigue activo para el rol junior');
  await page.screenshot({ path: `${OUT}/flow-rbac-junior.png` });

  /* Y si se fuerza el clic, el modal explica el permiso denegado. */
  await page.evaluate(() => document.querySelector('[data-action="try-isolate"]').removeAttribute('disabled'));
  await page.evaluate(() => document.querySelector('[data-action="try-isolate"]').click());
  await settle(220);
  const juniorModal = await page.evaluate(() => (document.querySelector('#mdTitle') || {}).textContent || '');
  if (!/rol/i.test(juniorModal)) problems.push('RBAC: el modal para junior no explica el permiso denegado');

  /* 1.7 · FR-008 · la whitelist valida y añade. */
  await page.goto(URL + '#/whitelist', { waitUntil: 'load' });
  await settle(260);
  await page.click('#wlForm button[type="submit"]');
  await settle(200);
  const cidrInvalido = await page.evaluate(() => document.querySelector('#eCidr').hidden === false);
  if (!cidrInvalido) problems.push('WHITELIST: un CIDR vacío no muestra error');

  await page.type('#fCidr', '192.168.44.0/24');
  await page.type('#fCountry', 'Colombia');
  await page.$eval('#fUntil', el => { el.value = '2027-06-30'; });
  await page.type('#fNote', 'Enlace del nuevo hospital satélite de Chía.');
  await page.click('#fAudit');
  await settle(150);
  await page.click('#wlForm button[type="submit"]');
  await settle(320);
  const anadida = await page.evaluate(() => document.body.innerText.includes('192.168.44.0/24'));
  if (!anadida) problems.push('WHITELIST: la entrada válida no se agregó a la tabla');
  await page.screenshot({ path: `${OUT}/flow-whitelist-alta.png`, fullPage: true });

  /* 1.8 · El modal huérfano no sobrevive a la navegación por hash. */
  await page.goto(URL + '#/alerta/INC-2026-0417', { waitUntil: 'load' });
  await settle(260);
  await page.click('[data-action="try-isolate"]');
  await settle(200);
  await page.goto(URL + '#/whitelist', { waitUntil: 'load' });
  await settle(280);
  const huerfano = await page.evaluate(() => !!document.querySelector('#mdTitle'));
  if (huerfano) problems.push('MODAL: quedó un modal abierto tras cambiar de ruta');

  /* ---------------------------------------------------------------- *
   * 2 · PRESENTACIÓN en los tres breakpoints
   * ---------------------------------------------------------------- */
  console.log('\n=== 2 · PRESENTACIÓN ===');
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    for (const [name, hash] of ROUTES) {
      await page.goto(URL + hash, { waitUntil: 'load' });
      await settle(280);
      const a = await page.evaluate(presentacion);
      const fallos = [];

      if (a.docSW > a.docCW) fallos.push(`overflow-x ${a.docSW}>${a.docCW}`);

      const dedupe = (arr, k) => {
        const m = new Map();
        arr.forEach(x => { const key = JSON.stringify(x[k] || x); if (!m.has(key)) m.set(key, x); });
        return [...m.values()];
      };
      dedupe(a.contraste, ['c', 'cr']).forEach(x =>
        fallos.push(`contraste ${x.c} "${x.txt}" ${x.cr}:1 < ${x.need}${x.inactivo ? ' (inactivo, listón 3:1)' : ''}`));
      dedupe(a.tap, ['c', 'w', 'h']).forEach(x =>
        fallos.push(`objetivo ${x.c} ${x.w}x${x.h} "${x.txt}"`));
      dedupe(a.microtexto, ['c', 'size']).forEach(x =>
        fallos.push(`microtexto ${x.c} ${x.size} "${x.txt}"`));
      dedupe(a.clip, ['c', 'sh']).forEach(x =>
        fallos.push(`contenido cortado ${x.c} ${x.sh}/${x.ch}`));

      console.log(`  ${vp.name}/${name.padEnd(11)} ${fallos.length ? fallos.length + ' fallo(s)' : 'OK'}`);
      fallos.forEach(f => problems.push(`${vp.name}/${name}: ${f}`));

      if (vp.name !== 'desktop' || name === 'dashboard') {
        await page.screenshot({ path: `${OUT}/${vp.name}-${name}.png`, fullPage: vp.name !== 'desktop' });
      }
    }
  }

  await browser.close();

  /* ---------------------------------------------------------------- */
  console.log('\n=== RESULTADO ===');
  if (problems.length) {
    problems.forEach(p => console.log('  ✗ ' + p));
    console.log(`\n  ${problems.length} problema(s).`);
    process.exit(1);
  }
  console.log('  ✓ sin problemas detectados');
})().catch(e => { console.error(e); process.exit(1); });