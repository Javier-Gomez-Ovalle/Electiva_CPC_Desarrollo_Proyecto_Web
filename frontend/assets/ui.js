/* =========================================================================
   HeraUEBA · ui.js
   Utilidades de marcado y componentes compartidos por todas las vistas.
   ========================================================================= */
window.UI = (function () {
  'use strict';

  const D = window.HERA;
  const icon = D.icon;

  const esc = s => String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* Severidad: glifo + etiqueta en mayúsculas. Nunca sólo color. */
  const SEV = {
    critico: { cls: 'badge--critical', icon: 'triangle', text: 'CRÍTICO' },
    media: { cls: 'badge--warn', icon: 'circleDot', text: 'ALERTA' },
    info: { cls: 'badge--ok', icon: 'check', text: 'SEGURO' }
  };
  function badge(sev) {
    const s = SEV[sev] || SEV.info;
    return '<span class="badge ' + s.cls + '">' + icon(s.icon, 14) + esc(s.text) + '</span>';
  }

  function unitBadge(u) {
    const crit = D.CRITICAL_UNITS.indexOf(u.unit) !== -1;
    return '<span class="badge ' + (crit ? 'badge--outline-critical' : 'badge--context') + '">'
      + (crit ? icon('triangle', 14) : '') + esc(u.unit.toUpperCase()) + '</span>';
  }

  function riskCell(v) {
    const cls = v >= 0.85 ? 'critical' : v >= 0.5 ? 'warn' : 'ok';
    return '<span class="risk risk--' + cls + '">' + v.toFixed(2) + '<span class="risk__den">/1.00</span></span>';
  }

  function kpi(kind, ic, label, value, foot) {
    return '<article class="kpi kpi--' + kind + '">'
      + '<p class="kpi__top">' + icon(ic, 15) + '<span class="label-caps">' + esc(label) + '</span></p>'
      + '<p class="kpi__value">' + esc(value) + '</p>'
      + '<p class="kpi__foot">' + esc(foot) + '</p></article>';
  }

  function dlRow(k, v) {
    return '<div class="dl__row"><dt class="dl__k">' + esc(k) + '</dt><dd class="dl__v">' + v + '</dd></div>';
  }

  function summaryRow(k, v) {
    return '<div class="summarybox__row"><span class="summarybox__k">' + esc(k) + '</span>'
      + '<span class="summarybox__v">' + v + '</span></div>';
  }

  function identity(id, isolated) {
    const u = D.USERS[id];
    return '<div class="identity">'
      + '<span class="identity__avatar" aria-hidden="true">' + esc(u.initials) + '</span>'
      + '<span class="grow">'
      + '<span class="identity__name">' + esc(u.full) + '</span>'
      + '<span class="identity__sub"><span class="mono">' + esc(u.id) + '</span> · ' + esc(u.job) + ' · ' + esc(u.dept) + '</span>'
      + '</span>'
      + (isolated ? '<span class="badge badge--outline-critical">' + icon('lock', 14) + 'AISLADA</span>' : '')
      + '</div>';
  }

  function notice(kind, ic, html) {
    return '<div class="notice notice--' + kind + '">' + icon(ic, 16) + '<div>' + html + '</div></div>';
  }

  /* --- Filas de la tabla de alertas -------------------------------------- */
  function alertRows(list, state) {
    return list.map(a => {
      const u = D.USERS[a.user];
      const crit = a.sev === 'critico';
      return '<tr class="is-clickable' + (crit ? ' is-critical' : '')
        + (state.isolated[a.user] ? ' is-isolated' : '') + '"'
        + ' data-goto="#/alerta/' + a.id + '" tabindex="0" role="link"'
        + ' aria-label="Abrir el detalle de la alerta ' + esc(a.id) + '">'
        + '<td data-label="Severidad">' + badge(a.sev) + '</td>'
        + '<td data-label="Riesgo">' + riskCell(a.risk) + '</td>'
        + '<td data-label="Usuario"><div class="cell-user"><span class="cell-user__name mono">' + esc(a.user)
        + '</span><span class="tiny">' + esc(u.job) + '</span></div></td>'
        + '<td data-label="Unidad">' + unitBadge(u) + '<div class="tiny" style="margin-top:4px">' + esc(u.dept) + '</div></td>'
        + '<td data-label="Origen"><span class="mono">' + esc(a.ip) + '</span>'
        + '<div class="tiny" style="margin-top:4px">' + icon('flag', 12) + ' ' + esc(a.country) + '</div></td>'
        + '<td data-label="' + (crit ? 'Regla de IA' : 'Patrón') + '">'
        + '<span style="display:block;color:var(--on-surface)">' + esc(a.ruleShort) + '</span>'
        + '<span class="mono tiny">' + esc(a.id) + '</span></td>'
        + '<td data-label="Hora"><span class="mono tnum">' + esc(a.time) + '</span></td>'
        + '<td data-label="Acciones"><div class="cell-actions">'
        + '<a class="btn btn--ghost btn--sm" href="#/alerta/' + a.id + '" tabindex="-1">Ver detalle' + icon('chevron', 14) + '</a>'
        + '</div></td></tr>';
    }).join('');
  }

  /* --- Línea de tiempo ---------------------------------------------------- */
  function timeline(events, withPayload) {
    return '<ol class="timeline">' + events.map(e =>
      '<li class="tl tl--' + e.k + '">'
      + '<span class="tl__time">' + esc(e.t) + '</span>'
      + '<span class="tl__axis"><span class="tl__dot">' + icon(e.icon, 13) + '</span></span>'
      + '<div class="tl__body">'
      + '<div class="row row--between" style="gap:8px;flex-wrap:nowrap">'
      + '<p class="tl__title">' + esc(e.title) + '</p>'
      + '<span class="tag">' + esc(e.verdict) + '</span></div>'
      + '<p class="tl__meta">' + esc(e.meta) + '</p>'
      + (withPayload && e.payload
        ? '<details class="tl__payload"><summary class="btn btn--link" style="font-size:12px">Ver payload crudo · hash '
          + esc(e.hash || '') + '</summary><pre class="codeblock" style="margin-top:8px">'
          + esc(JSON.stringify(e.payload, null, 2)) + '</pre></details>'
        : '')
      + '</div></li>').join('') + '</ol>';
  }

  /* --- Panel de caja blanca ---------------------------------------------- */
  const VERDICT_BADGE = {
    true: { cls: 'badge--critical', ic: 'check', text: 'CIERTO' },
    false: { cls: 'badge--neutral', ic: 'x', text: 'FALSO' },
    verify: { cls: 'badge--context', ic: 'shield', text: 'COMPROBACIÓN' },
    block: { cls: 'badge--outline-critical', ic: 'triangle', text: 'BR-002' }
  };

  function whitebox(a) {
    const t = D.TREES[a.id];

    if (!t) {
      return '<section class="card whitebox">'
        + '<div class="card__head"><div><h2 class="h-sub">Caja blanca · anomalía heurística</h2>'
        + '<p class="meta">Módulo <span class="mono">heur-ueba v0.9</span>, sin árbol de decisión</p></div></div>'
        + '<div class="card__body">'
        + '<p class="meta">Esta señal la produce el detector heurístico y no el árbol explicable. Se documenta la regla, el valor observado y el umbral superado.</p>'
        + '<pre class="codeblock codeblock--brand" style="margin-top:16px">'
        + esc('regla     → ' + a.rule)
        + '\n' + esc('observado → ' + a.ruleShort)
        + '\n' + esc('umbral    → 0.50')
        + '\n' + esc('score     → ' + a.risk.toFixed(2))
        + '\n' + esc('veredicto → REVISIÓN HUMANA')
        + '</pre></div></section>';
    }

    const below = t.factor < D.THRESHOLD;
    return '<section class="card whitebox sticky-col">'
      + '<div class="card__head">'
      + '<div><h2 class="h-sub">Caja blanca · Árbol de decisión</h2>'
      + '<p class="meta">Modelo <span class="mono">dt-ueba v2.4</span> · motor explicable determinista</p></div>'
      + '<button type="button" class="btn btn--secondary btn--sm" data-copy-tree="' + esc(a.id) + '">'
      + icon('copy', 14) + 'Copiar reglas</button></div>'

      + '<div class="card__body card__body--flush"><ul class="whitebox__path">'
      + t.nodes.map(n => {
        const v = VERDICT_BADGE[n.v];
        return '<li class="wbnode">'
          + '<div class="wbnode__head"><span class="wbnode__idx">NODO ' + n.i + '</span>'
          + '<span class="wbnode__verdict"><span class="badge ' + v.cls + '">' + icon(v.ic, 13) + v.text + '</span></span></div>'
          + '<p class="wbnode__rule">' + esc(n.rule) + '</p>'
          + '<p class="wbnode__obs">observado: <b>' + esc(n.obs) + '</b></p></li>';
      }).join('')
      + '</ul></div>'

      + '<div class="wbverdict">'
      + '<p class="wbverdict__label">Veredicto de la inferencia</p>'
      + '<p class="wbverdict__text">' + esc(t.verdict) + '</p>'
      + '<p class="wbverdict__meta">factor ' + t.factor.toFixed(2) + ' · incidencia ' + esc(t.incidence) + '</p>'
      + '<p class="wbverdict__meta wbverdict__gate">umbral_auto_bloqueo ' + D.THRESHOLD.toFixed(2)
      + ' · score ' + t.factor.toFixed(2) + ' → ' + (below ? 'score &lt; umbral' : 'score ≥ umbral')
      + ' · acción <b>ESCALAR A HUMANO</b></p>'
      + '<p class="wbverdict__note"><strong>BR-001</strong> · el motor no ejecuta el bloqueo: entrega la decisión a una persona con este resumen a la vista.</p>'
      + '</div>'

      + '<div class="card__body wb-extra">'
      + '<p class="label-caps">Regla global disparada</p>'
      + '<pre class="codeblock codeblock--brand" style="margin:0">' + esc(t.globalRule) + '</pre>'
      + '<p class="label-caps" style="margin:16px 0 8px">Interpretación del modelo</p>'
      + '<p class="meta" style="color:var(--on-surface)">' + esc(t.reading) + '</p>'
      + '<p class="tiny" style="margin-top:8px">Rama recorrida: ' + esc(t.branch) + '</p>'
      + '</div>'

      + '<div class="legend">'
      + '<span class="legend__item">' + icon('check', 13) + 'Regla verdadera; suma al puntaje</span>'
      + '<span class="legend__item">' + icon('x', 13) + 'Regla falsa; se exploró la rama derecha</span>'
      + '<span class="legend__item">' + icon('shield', 13) + 'Comprobación de política (BR-002)</span>'
      + '</div></section>';
  }

  /* --- Árbol de decisión en texto plano, para copiar --------------------- */
  function treeAsText(a) {
    const t = D.TREES[a.id];
    if (!t) return a.rule + '\n  score ' + a.risk.toFixed(2);
    const lines = t.nodes.map(n =>
      'NODO ' + n.i + '  ' + n.rule + '\n  → observado: ' + n.obs + '  [' + String(n.v).toUpperCase() + ']');
    lines.push('REGLA GLOBAL: ' + t.globalRule);
    lines.push('VEREDICTO: ' + t.verdict + ' (factor ' + t.factor.toFixed(2) + ')');
    lines.push('BR-001: umbral_auto_bloqueo ' + D.THRESHOLD.toFixed(2) + ' → ESCALAR A HUMANO');
    return lines.join('\n');
  }

  return { esc, badge, unitBadge, riskCell, kpi, dlRow, summaryRow, identity, notice, alertRows, timeline, whitebox, treeAsText };
})();
