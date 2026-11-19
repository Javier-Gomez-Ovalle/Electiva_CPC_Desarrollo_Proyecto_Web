/* =========================================================================
   HeraUEBA · frontend/assets/views.js
   Renderizadores de las vistas de la aplicación:
   - Dashboard Principal (#/dashboard)
   - Detalle de Alerta (#/alerta/:id)
   - Whitelist Geográfica (#/whitelist)
   - Historial Forense de Usuario (#/historial)
   - Aislamiento en 2 Pasos · Vista Completa (#/aislamiento)
   - Error Unidad Crítica BR-002 · Vista Completa (#/error-unidad-critica)
   - Matriz de Trazabilidad Normativa (#/trazabilidad)
   - Configurar Cuenta (#/perfil)
   - Inicio de Sesión SOC con Selección de Rol (#/login)
   ========================================================================= */
window.VIEWS = (function () {
  'use strict';

  const D = window.HERA, U = window.UI, M = window.MODALS;
  const esc = U.esc, icon = D.icon;

  function windowLabel(h) {
    if (h === 1) return '1 h';
    if (h === 24) return '24 h';
    if (h === 168) return '7 días (168 h)';
    if (h === 720) return '30 días (720 h)';
    return h + ' h';
  }

  /* -----------------------------------------------------------------------
     Vista 1 · Dashboard Principal
     Zona crítica por encima del pliegue; cola de análisis deliberadamente
     debajo. Filtro por defecto: 24 h.
     --------------------------------------------------------------------- */
  function dashboard(state, chrome) {
    const all = state.visibleAlerts;
    const crit = all.filter(a => a.sev === 'critico');
    const queue = all.filter(a => a.sev !== 'critico');
    const h = state.window;
    const maxRisk = Math.max.apply(null, D.ALERTS.map(a => a.risk));
    const isolatedTotal = Object.keys(state.isolated).length + 1;
    const medium = queue.length ? queue.length + (h >= 168 ? 9 : 7) : 0;
    const loginsKpi = h === 1 ? '318' : h === 24 ? '4 812' : h === 168 ? '31 940' : '128 450';

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Monitoreo' }
    ], 'Dashboard de monitoreo UEBA',
      'Clínica Central · Nodo SOC-BOG-01 · ' + crit.length + ' alertas críticas en ventana (' + windowLabel(h) + ')',
      'dashboard');

    const opt = (v, label, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + label + '</option>';

    const filterBtnLabel = state.onlyCritical
      ? 'Ver todas las alertas (' + state.windowAlertsCount + ')'
      : 'Revisar las ' + crit.length + ' críticas';

    return ''
      + '<div class="view__head">'
      + '<div><h1 class="view__title">Alertas de comportamiento · ventana de ' + windowLabel(h) + '</h1>'
      + '<p class="view__lede">La zona crítica se resuelve antes de cualquier desplazamiento: el analista debe poder triar las '
      + crit.length + ' alertas rojas sin hacer scroll. La cola de análisis queda deliberadamente debajo del pliegue.</p></div>'
      + '<button type="button" class="btn btn--primary" data-action="only-critical" aria-pressed="' + Boolean(state.onlyCritical) + '">'
      + icon(state.onlyCritical ? 'filter' : 'triangle', 16) + esc(filterBtnLabel) + '</button>'
      + '</div>'

      /* --- Filtros --- */
      + '<section class="filterbar" aria-label="Filtros del monitoreo">'
      + '<div class="filterbar__lead"><span class="label-caps">Ventana temporal</span>'
      + '<div class="chipset" role="group" aria-label="Ventana temporal en horas">'
      + [[1, '1 h'], [24, '24 h'], [168, '7 d'], [720, '30 d']].map(p =>
        '<button type="button" class="chip" data-window="' + p[0] + '" aria-pressed="' + (h === p[0]) + '">' + p[1] + '</button>').join('')
      + '</div></div>'
      + '<div class="filterbar__fields">'
      + '<label class="field"><span class="field__label">Nivel de riesgo</span><select class="select" data-filter="risk">'
      + opt('all', 'Todos', state.risk) + opt('alta', 'Alta · 0.85 o más', state.risk)
      + opt('media', 'Media · 0.50 – 0.84', state.risk) + opt('baja', 'Baja · menos de 0.50', state.risk)
      + '</select></label>'
      + '<label class="field"><span class="field__label">Departamento</span><select class="select" data-filter="unit">'
      + opt('all', 'Todos', state.unit)
      + Object.keys(D.USERS).map(k => opt(k, D.USERS[k].dept, state.unit)).join('')
      + '</select></label>'
      + '<label class="field"><span class="field__label">País de origen</span><select class="select" data-filter="country">'
      + opt('all', 'Todos', state.country)
      + ['DE', 'NL', 'VN', 'PA', 'ES'].map(c => opt(c, c, state.country)).join('')
      + '</select></label>'
      + '</div>'
      + '<p class="filterbar__note">' + icon('shield', 14)
      + '<span><strong>BR-001</strong> · Ninguna alerta produce bloqueo automático. El umbral de auto-bloqueo del motor es '
      + D.THRESHOLD.toFixed(2) + ' y el máximo alcanzado hoy es ' + maxRisk.toFixed(2)
      + ': toda mitigación exige a una persona y queda registrada en bitácora.</span></p>'
      + '</section>'

      /* --- Indicadores --- */
      + '<section class="grid grid--kpi" aria-label="Indicadores de la ventana" style="margin-bottom:24px">'
      + U.kpi('critical', 'triangle', 'Alertas críticas', String(crit.length), 'Requieren decisión del coordinador')
      + U.kpi('warn', 'circleDot', 'Alertas medias', String(medium), state.onlyCritical ? 'Ocultas por filtro crítico activo' : 'En observación activa')
      + U.kpi('ok', 'lock', 'Cuentas aisladas', String(isolatedTotal), 'Aislamiento manual confirmado')
      + U.kpi('info', 'activity', 'Inicios de sesión', loginsKpi, 'Ingesta Keycloak activa (' + windowLabel(h) + ')')
      + '</section>'

      /* --- Zona crítica, sin desplazamiento --- */
      + '<section class="card" style="margin-bottom:24px" aria-labelledby="zonaCritica">'
      + '<div class="card__head">'
      + '<div><h2 class="h-card" id="zonaCritica">Alertas rojas activas '
      + '<span class="badge badge--critical" style="margin-left:8px;vertical-align:middle">' + crit.length + '</span></h2>'
      + '<p class="meta">Prioridad alta e inmediata · ventana de ' + windowLabel(h) + ' · ordenadas por puntaje de riesgo</p></div>'
      + '<span class="tag">' + icon('fingerprint', 12) + 'dt-ueba v2.4</span></div>'
      + '<div class="tablewrap"><table class="table">'
      + '<caption class="sr-only">Alertas críticas de la ventana de ' + h + ' horas</caption>'
      + '<thead><tr><th>Severidad</th><th>Riesgo</th><th>Usuario</th><th>Unidad</th><th>Origen</th>'
      + '<th>Regla de IA detectada</th><th>Hora</th><th>Acciones</th></tr></thead><tbody>'
      + (crit.length ? U.alertRows(crit, state)
        : '<tr><td colspan="8"><p class="meta" style="padding:24px;text-align:center">Sin alertas críticas con los filtros actuales.</p></td></tr>')
      + '</tbody></table></div>'
      + '<div class="card__foot row row--between">'
      + '<span>' + icon('info', 13) + ' El nivel nunca se comunica sólo con color: cada fila combina glifo, etiqueta en mayúsculas y franja lateral.</span>'
      + '<span class="mono tiny">shard 02 · nodo SOC-BOG-01</span></div></section>'

      /* --- Cola de análisis --- */
      + '<section class="card" aria-labelledby="colaAnalisis">'
      + '<div class="card__head">'
      + '<div><h2 class="h-card" id="colaAnalisis">Cola de análisis '
      + '<span class="badge badge--warn" style="margin-left:8px;vertical-align:middle">' + queue.length + '</span></h2>'
      + '<p class="meta">Alertas en observación y anomalías heurísticas · no requieren decisión inmediata</p></div>'
      + '<a class="btn btn--secondary btn--sm" href="#/historial">' + icon('user', 14) + 'Historial de usuarios</a></div>'
      + '<div class="tablewrap"><table class="table">'
      + '<caption class="sr-only">Cola de análisis: anomalías de riesgo medio</caption>'
      + '<thead><tr><th>Severidad</th><th>Riesgo</th><th>Usuario</th><th>Unidad</th><th>País</th>'
      + '<th>Patrón detectado</th><th>Hora</th><th>Acciones</th></tr></thead><tbody>'
      + (queue.length ? U.alertRows(queue, state)
        : '<tr><td colspan="8"><p class="meta" style="padding:24px;text-align:center">'
          + (state.onlyCritical
            ? 'Filtro de alertas críticas activo. Pulsa «Ver todas las alertas» arriba para mostrar la cola de análisis.'
            : 'La cola está vacía con los filtros actuales.')
          + '</p></td></tr>')
      + '</tbody></table></div>'
      + '<div class="card__foot row row--between">'
      + '<span>' + icon('arrowDown', 13) + ' ' + queue.length
      + ' alertas de prioridad media en la ventana actual permanecen bajo el pliegue: la zona crítica nunca compite por atención.</span>'
      + '<span class="mono tiny">retención 180 d</span></div></section>';
  }

  /* -----------------------------------------------------------------------
     Vista 2 · Detalle de alerta con caja blanca
     --------------------------------------------------------------------- */
  function alertDetail(id, state, chrome) {
    const a = D.EXTENDED_ALERTS.find(x => x.id === id) || D.ALERTS[0];
    const u = D.USERS[a.user];
    const role = D.ROLES[state.role];
    const critUnit = D.CRITICAL_UNITS.indexOf(u.unit) !== -1;
    const t = D.TREES[a.id];
    const events = D.eventsFor(a.id);

    chrome([
      { text: 'Monitoreo', href: '#/dashboard' },
      { text: 'Alerta crítica', href: '#/dashboard' },
      { text: a.id }
    ], a.title, a.id + ' · ' + u.dept + ' · ' + a.at + ' COT', 'dashboard');

    const btnAttrs = role.canIsolate ? '' : ' disabled aria-disabled="true"';
    const isolateBtn = '<button type="button" class="btn btn--danger" data-action="try-isolate" data-user="'
      + esc(a.user) + '"' + btnAttrs + '>' + icon('lock', 16) + 'Aislar usuario</button>';

    let help;
    if (!role.canIsolate) {
      help = '<p class="hint">' + icon('info', 14) + '<span>Bloqueado por rol: el aislamiento de cuentas exige el rol '
        + '<strong>Coordinador SOC</strong>. Tu sesión activa es <strong>' + esc(role.label)
        + '</strong>, que puede investigar, copiar evidencia y escalar, pero no mitigar.</span></p>';
    } else if (critUnit) {
      help = '<p class="hint">' + icon('triangle', 14) + '<span>Esta cuenta pertenece a <strong>' + esc(u.unit)
        + '</strong>, unidad clasificada como crítica. El sistema te informará de la regla <strong>BR-002</strong> antes de cualquier cambio.</span></p>';
    } else {
      help = '<p class="hint">' + icon('shield', 14) + '<span>La mitigación exigirá motivo y re-autenticación, y quedará registrada en bitácora con tu identidad y hora.</span></p>';
    }

    return ''
      + '<div class="view__head">'
      + '<div>'
      + '<div class="row" style="gap:8px;margin-bottom:8px">' + U.badge(a.sev)
      + '<span class="badge badge--neutral">' + icon('activity', 13) + 'Puntaje ' + a.risk.toFixed(2) + ' / 1.00</span>'
      + '<span class="badge badge--context">' + icon('ticket', 13) + esc(a.status) + '</span>'
      + U.unitBadge(u) + '</div>'
      + '<h1 class="view__title">' + esc(a.title) + '</h1>'
      + '<p class="view__lede">Detectado <span class="mono">' + esc(a.at) + ' COT</span> · ' + esc(a.id)
      + ' · origen <span class="mono">' + esc(a.ip) + '</span> (' + esc(a.asn) + ')</p></div>'
      + '<div class="row">'
      + '<button type="button" class="btn btn--secondary btn--sm" data-copy-inc="' + esc(a.id) + '">'
      + icon('copy', 14) + 'Copiar incidente</button>'
      + '<button type="button" class="btn btn--secondary btn--sm" data-action="export">'
      + icon('download', 14) + 'Exportar STIX / JSON</button>'
      + '</div></div>'

      + '<div style="margin-bottom:24px">' + U.notice('block', 'triangle',
        '<strong>Alerta crítica con origen fuera de la whitelist.</strong> El acceso se produce desde ' + esc(a.country)
        + ', fuera de la whitelist del usuario y fuera del patrón histórico validado por el Comité de Ciberseguridad Hospitalaria. '
        + 'La trazabilidad normativa exige mostrar <em>por qué</em> se marcó la sesión antes de permitir cualquier mitigación.') + '</div>'

      /* --- Acciones de mitigación --- */
      + '<section class="card" style="margin-bottom:24px" aria-label="Acciones de mitigación">'
      + '<div class="card__body actions-row">'
      + '<div class="grow stack stack--sm">'
      + '<p class="label-caps">Decisión del analista</p>'
      + '<div class="row" style="gap:12px">' + isolateBtn
      + '<button type="button" class="btn btn--secondary" data-action="escalate">Escalar al CISO</button>'
      + '<a class="btn btn--ghost" href="#/historial?u=' + esc(a.user) + '">' + icon('user', 16)
      + 'Ver historial de ' + esc(a.user) + '</a></div>'
      + help + '</div>'
      + '<div class="summarybox" style="min-width:260px">'
      + U.summaryRow('Regla global', '<span class="mono" style="font-size:12px">' + esc(a.rule) + '</span>')
      + U.summaryRow('Umbral auto-bloqueo', '<span class="mono">' + D.THRESHOLD.toFixed(2) + '</span>')
      + U.summaryRow('Decisión del motor', t ? 'ESCALAR A HUMANO' : 'REVISIÓN HUMANA')
      + '</div></div></section>'

      + '<div class="grid grid--detail">'
      /* Columna izquierda */
      + '<div class="stack">'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Sujeto afectado</h2>'
      + '<span class="tag">' + (state.isolated[a.user] ? 'CUENTA AISLADA' : 'CUENTA ACTIVA') + '</span></div>'
      + '<div class="card__body stack stack--md">' + U.identity(a.user, state.isolated[a.user])
      + '<dl class="dl">'
      + U.dlRow('Departamento', esc(u.dept))
      + U.dlRow('Unidad clínica', esc(u.floor))
      + U.dlRow('Turno habitual', esc(u.shift))
      + U.dlRow('MFA', u.mfa
        ? '<span class="badge badge--ok">' + icon('check', 13) + 'ACTIVADO</span>'
        : '<span class="badge badge--warn">' + icon('triangle', 13) + 'NO REGISTRADO</span>')
      + U.dlRow('Antigüedad', esc(u.tenure))
      + U.dlRow('Último login legítimo', '<span class="mono">' + esc(u.lastLegit) + '</span>')
      + '</dl></div></section>'

      + '<section class="card"><div class="card__head">'
      + '<div><h2 class="h-sub">Línea de tiempo de eventos</h2>'
      + '<p class="meta">Telemetría SOC · ' + events.length + ' eventos registrados</p></div>'
      + '<span class="tag">' + icon('server', 12) + 'Keycloak + EDR</span></div>'
      + '<div class="card__body">' + U.timeline(events, true) + '</div></section>'
      + '</div>'

      /* Columna derecha: caja blanca */
      + '<div class="stack">' + U.whitebox(a)
      + '<div class="card"><div class="card__body">'
      + '<p class="label-caps" style="margin-bottom:8px">Criterios de auditoría aplicados</p>'
      + '<ul class="impactlist">'
      + '<li>' + icon('check', 14) + '<span>La severidad se comunica con glifo y etiqueta en mayúsculas, nunca sólo con color.</span></li>'
      + '<li>' + icon('check', 14) + '<span>La ruta de decisión es legible línea a línea y copiable para el expediente.</span></li>'
      + '<li>' + icon('check', 14) + '<span>El árbol incluye la comprobación de unidad crítica antes de proponer mitigación.</span></li>'
      + '<li>' + icon('check', 14) + '<span>Sin gráficos circulares ni de barras: la cifra crítica es texto tabular.</span></li>'
      + '</ul></div></div>'
      + '</div></div>';
  }

  /* -----------------------------------------------------------------------
     Vista 3 · Gestión de whitelist (CRUD)
     --------------------------------------------------------------------- */
  function whitelist(state, chrome) {
    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Whitelist geográfica' }
    ], 'Gestión de whitelist geográfica',
      state.wl.length + ' entradas · política institucional auditada', 'whitelist');

    const stCls = s => s === 'activa' ? 'badge--ok' : s === 'por vencer' ? 'badge--warn' : 'badge--neutral';
    const stIc = s => s === 'activa' ? 'check' : s === 'por vencer' ? 'triangle' : 'x';

    const rows = state.wl.map(w =>
      '<tr>'
      + '<td data-label="Red / CIDR"><span class="mono">' + esc(w.cidr) + '</span></td>'
      + '<td data-label="País">' + icon('flag', 13) + ' ' + esc(w.country) + ' <span class="tag">' + esc(w.cc) + '</span></td>'
      + '<td data-label="Ámbito">' + esc(w.scope) + '<div class="tiny" style="margin-top:4px">' + esc(w.note) + '</div></td>'
      + '<td data-label="Vigencia"><span class="mono">' + esc(w.until) + '</span></td>'
      + '<td data-label="Responsable">' + esc(w.by) + '</td>'
      + '<td data-label="Estado"><span class="badge ' + stCls(w.state) + '">' + icon(stIc(w.state), 13)
      + esc(w.state.toUpperCase()) + '</span></td>'
      + '<td data-label="Acciones"><div class="cell-actions">'
      + '<button type="button" class="btn btn--ghost btn--sm" data-action="wl-toggle" data-cidr="' + esc(w.cidr) + '">'
      + (w.state === 'activa' ? 'Desactivar' : 'Reactivar') + '</button>'
      + '<button type="button" class="btn btn--ghost btn--sm" data-action="wl-del" data-cidr="' + esc(w.cidr)
      + '" aria-label="Eliminar la entrada ' + esc(w.cidr) + '">' + icon('trash', 14) + '</button>'
      + '</div></td></tr>').join('');

    return ''
      + '<div class="view__head">'
      + '<div><h1 class="view__title">Whitelist geográfica</h1>'
      + '<p class="view__lede">Rangos y países que el motor UEBA no eleva a alerta. Toda entrada exige justificación clínica, '
      + 'vigencia y responsable: una whitelist sin caducidad es una puerta trasera. El filtro de 24 h del dashboard no aplica '
      + 'aquí; esta vista opera sobre la configuración permanente.</p></div></div>'

      + '<section class="grid grid--kpi" aria-label="Resumen de whitelist" style="margin-bottom:24px">'
      + U.kpi('info', 'globe', 'Entradas activas', String(state.wl.filter(w => w.state === 'activa').length),
        'De ' + state.wl.length + ' configuradas')
      + U.kpi('warn', 'clock', 'Por vencer', String(state.wl.filter(w => w.state === 'por vencer').length),
        'Dentro de 30 días')
      + U.kpi('critical', 'triangle', 'Expiradas', String(state.wl.filter(w => w.state === 'expirada').length),
        'Requieren decisión del comité')
      + U.kpi('ok', 'shield', 'Cobertura', '41', 'Países con política de acceso')
      + '</section>'

      + '<div class="grid grid--split">'
      + '<div class="stack">'
      + '<section class="card">'
      + '<div class="card__head"><div><h2 class="h-card">Entradas configuradas</h2>'
      + '<p class="meta">Cada cambio queda en bitácora con responsable y hora</p></div></div>'
      + '<div class="tablewrap"><table class="table">'
      + '<caption class="sr-only">Entradas de whitelist geográfica</caption>'
      + '<thead><tr><th>Red / CIDR</th><th>País</th><th>Ámbito y justificación</th><th>Vigencia</th>'
      + '<th>Responsable</th><th>Estado</th><th>Acciones</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table></div>'
      + '<div class="card__foot">' + icon('info', 13)
      + ' Desactivar conserva la entrada y su historial: la auditoría exige que una retirada sea reversible y trazable.</div>'
      + '</section></div>'

      + '<div class="stack sticky-col">'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Nueva entrada</h2>'
      + '<span class="tag">' + icon('shield', 12) + 'requiere rol coordinador</span></div>'
      + '<form class="card__body stack stack--md" id="wlForm" novalidate>'
      + '<label class="field"><span class="field__label">Red o dirección CIDR <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input input--mono" name="cidr" id="fCidr" placeholder="190.24.0.0/16" required aria-describedby="eCidr">'
      + '<span class="field__error" id="eCidr" hidden></span></label>'
      + '<label class="field"><span class="field__label">País <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input" name="country" id="fCountry" placeholder="Colombia" required aria-describedby="eCountry">'
      + '<span class="field__error" id="eCountry" hidden></span></label>'
      + '<label class="field"><span class="field__label">Ámbito de aplicación</span>'
      + '<select class="select" name="scope">'
      + '<option>Institucional</option><option>Todos los usuarios</option>'
      + '<option>Urgencias · Satélital</option><option>Proveedor externo</option>'
      + '<option>Laboratorio · socio</option></select></label>'
      + '<label class="field"><span class="field__label">Vigencia <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input" type="date" name="until" id="fUntil" required aria-describedby="eUntil">'
      + '<span class="field__hint">Las entradas permanentes requieren aprobación del Comité de Ciberseguridad.</span>'
      + '<span class="field__error" id="eUntil" hidden></span></label>'
      + '<label class="field"><span class="field__label">Justificación clínica <span class="field__req" aria-hidden="true">*</span></span>'
      + '<textarea class="textarea" name="note" id="fNote" placeholder="Ej. Enlace de Disaster Recovery con la UCI móvil"'
      + ' required aria-describedby="eNote"></textarea>'
      + '<span class="field__error" id="eNote" hidden></span></label>'
      + '<label class="checkline"><input type="checkbox" name="audit" id="fAudit">'
      + '<span class="checkline__text">Confirmo que esta entrada <strong>no amplía el acceso al historial clínico</strong> '
      + 'fuera de la justificación registrada.</span></label>'
      + '<button type="submit" class="btn btn--primary btn--block">' + icon('plus', 16) + 'Agregar entrada</button>'
      + '<p class="hint">' + icon('info', 14) + '<span>La alta queda registrada como <strong>'
      + esc(D.ROLES[state.role].name) + '</strong> en la bitácora de configuración.</span></p>'
      + '</form></section></div>'
      + '</div>';
  }

  /* -----------------------------------------------------------------------
     Vista 4 · Historial de usuario (con filtros interactivos de ventana/tipo/resultado)
     --------------------------------------------------------------------- */
  function history(state, chrome) {
    const id = state.history.user;
    const u = D.USERS[id];
    const h = D.HISTORY[id];
    const alertRef = (D.ALERTS.find(a => a.user === id) || {}).id;
    const events = D.eventsFor(alertRef, state.history);
    const role = D.ROLES[state.role];

    const winScale = state.history.window === '1h' ? 0.05
      : state.history.window === '12h' ? 0.08
      : state.history.window === '24h' ? 0.12
      : state.history.window === '3d' ? 0.22
      : state.history.window === '7d' ? 0.35
      : state.history.window === '15d' ? 0.50
      : state.history.window === '30d' ? 0.68 : 1.0;

    const scaledTotal = Math.max(events.length, Math.round(h.total * winScale));
    const scaledLogins = Math.max(1, Math.round(h.logins * winScale));
    const scaledFails = state.history.window === '1h' ? Math.min(events.filter(e => e.res === 'fallo').length, 14)
      : state.history.window === '12h' ? Math.min(h.fails, 15)
      : state.history.window === '24h' ? Math.min(h.fails, 18)
      : Math.round(h.fails * winScale);

    const winNames = {
      '1h': 'Última hora',
      '12h': 'Últimas 12 h (Turno)',
      '24h': 'Últimas 24 h',
      '3d': 'Últimos 3 días',
      '7d': 'Últimos 7 días',
      '15d': 'Últimos 15 días',
      '30d': 'Últimos 30 días',
      'full': 'Retención completa (180 días)',
      '180d': 'Retención completa (180 días)'
    };

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Historial de usuario' }
    ], 'Historial forense de ' + id, u.full + ' · ' + u.dept + ' · ' + (winNames[state.history.window] || '24 h'), 'historial');

    const opt = (v, label, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + label + '</option>';

    return ''
      + '<div class="view__head">'
      + '<div>' + U.identity(id, state.isolated[id]) + '</div>'
      + '<div class="row">'
      + '<button type="button" class="btn btn--primary" data-action="open-ticket">' + icon('ticket', 16)
      + 'Abrir ticket de incidente</button></div></div>'

      /* Selector de cuenta */
      + '<div class="chipset" role="group" aria-label="Seleccionar cuenta" style="margin-bottom:16px">'
      + Object.keys(D.USERS).map(k =>
        '<button type="button" class="chip" data-user="' + esc(k) + '" aria-pressed="' + (k === id) + '">'
        + esc(k) + '</button>').join('')
      + '</div>'

      /* Filtros del historial */
      + '<section class="filterbar" aria-label="Filtros del historial">'
      + '<div class="filterbar__lead"><span class="label-caps">Ventana de consulta</span>'
      + '<div class="chipset" role="group" aria-label="Ventana del historial">'
      + [['1h', '1 h'], ['24h', '24 h'], ['7d', '7 días'], ['30d', '30 días'], ['full', '180 d (completo)']]
        .map(p => '<button type="button" class="chip" data-hwin="' + p[0] + '" aria-pressed="'
          + (state.history.window === p[0] || (p[0] === 'full' && state.history.window === '180d')) + '">' + p[1] + '</button>').join('')
      + '</div></div>'
      + '<div class="filterbar__fields">'
      + '<label class="field"><span class="field__label">Filtro temporal (horas / días)</span><select class="select" data-h="window">'
      + opt('1h', '1 hora (inmediato)', state.history.window)
      + opt('12h', '12 horas (turno)', state.history.window)
      + opt('24h', '24 horas (día)', state.history.window)
      + opt('3d', '3 días (reciente)', state.history.window)
      + opt('7d', '7 días (semana)', state.history.window)
      + opt('15d', '15 días (quincena)', state.history.window)
      + opt('30d', '30 días (mes)', state.history.window)
      + opt('full', '180 días (data lake completo)', state.history.window) + '</select></label>'
      + '<label class="field"><span class="field__label">Tipo de evento</span><select class="select" data-h="type">'
      + opt('all', 'Todos', state.history.type)
      + opt('login', 'Inicios de sesión', state.history.type)
      + opt('fail', 'Fallos de autenticación', state.history.type)
      + opt('mfa', 'Desafíos MFA', state.history.type)
      + opt('wl', 'Excepciones de whitelist', state.history.type) + '</select></label>'
      + '<label class="field"><span class="field__label">Resultado</span><select class="select" data-h="result">'
      + opt('all', 'Todos los estados', state.history.result)
      + opt('anomalia', 'Anomalías críticas', state.history.result)
      + opt('fallo', 'Fallos', state.history.result)
      + opt('exito', 'Éxitos confirmados', state.history.result) + '</select></label>'
      + '<div class="field"><span class="field__label">Sesión activa</span>'
      + '<p class="input mono" style="display:flex;align-items:center;min-height:40px">' + esc(h.session) + '</p></div>'
      + '</div>'
      + '<p class="filterbar__note">' + icon('shield', 14)
      + '<span><strong>Aviso de alcance forense:</strong> esta vista ignora el filtro global de 24 h del dashboard y consulta '
      + 'la retención completa de 180 días almacenada en el data lake (' + esc(winNames[state.history.window]) + '). Identidad de la sesión: ' + esc(role.name) + '.</span></p>'
      + '</section>'

      + '<section class="grid grid--kpi" aria-label="Indicadores de la cuenta" style="margin-bottom:24px">'
      + U.kpi('info', 'activity', 'Eventos en ventana', scaledTotal.toLocaleString('es-CO'), winNames[state.history.window])
      + U.kpi('ok', 'check', 'Inicios de sesión', scaledLogins.toLocaleString('es-CO'), 'Sesiones autenticadas')
      + U.kpi('warn', 'triangle', 'Fallos de autenticación', String(scaledFails), 'Ráfagas detectadas en ventana')
      + U.kpi('info', 'globe', 'Países distintos', String(h.countries.split(',').length), esc(h.countries))
      + '</section>'

      + '<div class="grid grid--detail">'
      + '<section class="card"><div class="card__head">'
      + '<div><h2 class="h-card">Línea de tiempo de eventos (' + esc(winNames[state.history.window]) + ')</h2>'
      + '<p class="meta">Mostrando ' + events.length + ' eventos detallados de ' + scaledTotal.toLocaleString('es-CO') + ' en la ventana seleccionada</p></div>'
      + '<span class="tag">' + icon('server', 12) + 'data lake · nodo 3</span></div>'
      + '<div class="card__body">'
      + (events.length ? U.timeline(events, true)
        : '<p class="meta" style="padding:16px 0">No hay eventos que coincidan con el filtro de tipo o resultado en esta ventana.</p>')
      + '</div></section>'

      + '<div class="stack sticky-col">'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Ficha de la cuenta</h2></div>'
      + '<div class="card__body"><dl class="dl">'
      + U.dlRow('Identificador', '<span class="mono">' + esc(u.id) + '</span>')
      + U.dlRow('Correo', '<span class="mono" style="font-size:13px">' + esc(u.email) + '</span>')
      + U.dlRow('Unidad', esc(u.dept))
      + U.dlRow('MFA', u.mfa ? 'Activado' : 'No registrado')
      + U.dlRow('Última anomalía', '<span class="badge badge--warn">' + icon('triangle', 13) + esc(h.lastAnomaly) + '</span>')
      + U.dlRow('Estado', state.isolated[id]
        ? '<span class="badge badge--outline-critical">' + icon('lock', 13) + 'AISLADA</span>'
        : '<span class="badge badge--ok">' + icon('check', 13) + 'ACTIVA</span>')
      + '</dl></div></section>'

      + '<section class="card"><div class="card__head"><h2 class="h-sub">Acciones sobre la cuenta</h2></div>'
      + '<div class="card__body stack stack--sm">'
      + '<button type="button" class="btn btn--danger btn--block" data-action="try-isolate" data-user="' + esc(id) + '"'
      + (role.canIsolate ? '' : ' disabled aria-disabled="true"') + '>' + icon('lock', 16) + 'Aislar usuario</button>'
      + '<a class="btn btn--secondary btn--block" href="#/whitelist">' + icon('globe', 16) + 'Revisar su whitelist</a>'
      + (role.canIsolate ? ''
        : '<p class="hint">' + icon('info', 14) + '<span>El aislamiento exige el rol <strong>Coordinador SOC</strong>. '
        + 'Tu sesión es <strong>' + esc(role.label) + '</strong>.</span></p>')
      + '</div></section>'
      + '</div></div>';
  }

  /* -----------------------------------------------------------------------
     Vista 5 · Aislamiento · 2 pasos (Vista completa dedicada FR-005 / FR-006)
     --------------------------------------------------------------------- */
  function isolationView(state, chrome) {
    const targetId = state.isolation.target || 'mg.ramirez';
    const u = D.USERS[targetId] || D.USERS['mg.ramirez'];
    const role = D.ROLES[state.role];
    const f = state.isolation;
    const err = f.errors || {};
    const step = f.step || 1;
    const matches = (f.confirm || '').trim().toUpperCase() === 'AISLAR';
    const pct = matches ? 100 : f.confirm ? Math.min(90, Math.round(f.confirm.length / 5 * 90)) : 0;

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Cumplimiento y Gobernanza', href: '#/aislamiento' },
      { text: 'Aislamiento · 2 pasos' }
    ], 'Protocolo de aislamiento seguro en 2 pasos',
      'FR-005 · FR-006 · BR-001 · Fricción deliberada contra bloqueos accidentales', 'aislamiento');

    const nonCritUsers = Object.keys(D.USERS).filter(k => D.CRITICAL_UNITS.indexOf(D.USERS[k].unit) === -1);

    let stepPanel;
    if (!role.canIsolate) {
      stepPanel = ''
        + '<section class="card">'
        + '<div class="card__head"><h2 class="h-card" id="mdTitle">Aislamiento no disponible para tu rol</h2>'
        + '<span class="badge badge--neutral">RBAC · NFR-003</span></div>'
        + '<div class="card__body stack stack--md">'
        + U.notice('block', 'triangle',
          '<strong>Tu sesión está autenticada como ' + esc(role.label) + '.</strong> El aislamiento de una cuenta clínica '
          + 'exige el rol <strong>Coordinador SOC</strong>. Los roles de Analista Junior y Analista Senior pueden investigar, '
          + 'copiar evidencia de caja blanca y escalar al CISO, pero tienen bloqueada la ejecución de cuarentenas.')
        + '<div class="row">'
        + '<a class="btn btn--primary" href="#/historial?u=' + esc(targetId) + '">' + icon('user', 16) + 'Ver el historial del usuario</a>'
        + '<a class="btn btn--secondary" href="#/dashboard">Volver al monitoreo</a>'
        + '</div></div></section>';
    } else if (step === 1) {
      stepPanel = ''
        + '<section class="card">'
        + '<div class="card__head">'
        + '<div><h2 class="h-card" id="mdTitle">Aislar la cuenta ' + esc(u.id) + ' · Paso 1 de 2</h2>'
        + '<p class="meta" id="mdLede">Justificación clínica obligatoria y re-autenticación de dominio del operador</p></div>'
        + (window.MODALS ? window.MODALS.stepper(1) : '') + '</div>'
        + '<div class="card__body stack stack--md">'
        + U.notice('rule', 'shield',
          '<strong>Qué va a pasar.</strong> Se revocarán las sesiones activas de <strong>' + esc(u.id) + '</strong>, se bloqueará '
          + 'el acceso al historial clínico y al módulo de prescripción, y el titular recibirá una notificación. La cuenta '
          + '<strong>no se elimina</strong>: la reversión es parte del diseño. Todo queda en bitácora con tu identidad.')
        + '<div class="field">'
        + '<span class="field__label">Seleccionar cuenta sujeta a cuarentena (unidades no críticas)</span>'
        + '<div class="chipset" role="group" aria-label="Cuentas elegibles para aislamiento">'
        + nonCritUsers.map(k =>
          '<button type="button" class="chip" data-iso-target="' + esc(k) + '" aria-pressed="' + (k === u.id) + '">'
          + esc(k) + ' (' + esc(D.USERS[k].unit) + ')</button>'
        ).join('')
        + '</div></div>'
        + '<div class="summarybox">'
        + U.summaryRow('Cuenta', esc(u.full))
        + U.summaryRow('Identificador', '<span class="mono">' + esc(u.id) + '</span>')
        + U.summaryRow('Unidad', esc(u.dept) + ' (No exceptuada por BR-002)')
        + U.summaryRow('Estado actual', state.isolated[u.id]
          ? '<span class="badge badge--outline-critical">' + icon('lock', 13) + 'AISLADA</span>'
          : '<span class="badge badge--ok">' + icon('check', 13) + 'ACTIVA</span>')
        + U.summaryRow('Operadora resolutiva', esc(role.name) + ' · ' + esc(role.label))
        + '</div>'
        + '<div class="field">'
        + '<label class="field__label" for="mReason">Motivo de la mitigación <span class="field__req" aria-hidden="true">*</span></label>'
        + '<textarea class="textarea" id="mReason" name="reason" aria-describedby="mReasonHelp mReasonErr" placeholder="Ej. Credencial comprometida confirmada: 14 intentos fallidos desde ASN 60729 (Alemania) y posterior acceso exitoso desde IP no autorizada.">' + esc(f.reason) + '</textarea>'
        + '<span class="field__hint" id="mReasonHelp">Mínimo 30 caracteres. Este texto se copia literalmente al ticket y a la notificación al titular.</span>'
        + '<span class="field__error" id="mReasonErr"' + (err.reason ? '' : ' hidden') + '>' + (err.reason ? icon('triangle', 14) + esc(err.reason) : '') + '</span>'
        + '</div>'
        + '<div class="field">'
        + '<label class="field__label" for="mReauth">Re-autenticación del operador <span class="field__req" aria-hidden="true">*</span></label>'
        + '<input class="input" type="password" id="mReauth" name="reauth" autocomplete="current-password" value="' + esc(f.reauth)
        + '" aria-describedby="mReauthHelp mReauthErr" placeholder="Contraseña de dominio (demo-pass-2026)">'
        + '<span class="field__hint" id="mReauthHelp">Se valida contra Keycloak antes de habilitar el paso 2. Se guarda sólo el resultado en AUDIT_LOGS, nunca el secreto.</span>'
        + '<span class="field__error" id="mReauthErr"' + (err.reauth ? '' : ' hidden') + '>' + (err.reauth ? icon('triangle', 14) + esc(err.reauth) : '') + '</span>'
        + '</div>'
        + '<label class="checkline"><input type="checkbox" name="notify" id="mNotify"' + (f.notify ? ' checked' : '') + '>'
        + '<span class="checkline__text">Notificar al jefe de servicio y al titular por el canal clínico.</span></label>'
        + '<label class="checkline"><input type="checkbox" name="evidence" id="mEvidence"' + (f.evidence ? ' checked' : '') + '>'
        + '<span class="checkline__text">Adjuntar al expediente la ruta completa del árbol de decisión (caja blanca).</span></label>'
        + '</div>'
        + '<div class="card__foot row row--between">'
        + '<span class="tiny">El paso 2 exigirá escribir literalmente la palabra de confirmación AISLAR.</span>'
        + '<div class="row">'
        + '<a class="btn btn--ghost" href="#/alerta/INC-2026-0417">Ver alerta asociada</a>'
        + '<button type="button" class="btn btn--primary" data-action="iso-next">Continuar al paso 2</button>'
        + '</div></div></section>';
    } else {
      stepPanel = ''
        + '<section class="card modal">'
        + '<div class="card__head">'
        + '<div><h2 class="h-card" id="mdTitle">Confirmación explícita · Paso 2 de 2</h2>'
        + '<p class="meta" id="mdLede">Último control de fricción segura antes de ejecutar la cuarentena sobre ' + esc(u.full) + '</p></div>'
        + (window.MODALS ? window.MODALS.stepper(2) : '') + '</div>'
        + '<div class="card__body stack stack--md">'
        + '<div class="summarybox">'
        + U.summaryRow('Cuenta', esc(u.id))
        + U.summaryRow('Unidad', esc(u.dept))
        + U.summaryRow('Motivo registrado', '<span style="font-weight:400">' + esc(f.reason) + '</span>')
        + U.summaryRow('Notificación clínica', f.notify ? 'Se enviará al jefe de servicio' : 'No solicitada')
        + U.summaryRow('Evidencia adjunta', f.evidence ? 'Árbol de decisión completo (FR-004)' : 'No adjunta')
        + U.summaryRow('Operadora', esc(role.name) + ' · ' + esc(role.label))
        + '</div>'
        + U.notice('rule', 'gavel',
          'Escribe literalmente <span class="confirmword">AISLAR</span> para habilitar la ejecución. Esta fricción existe para '
          + 'que nadie corte una sesión clínica por inercia.')
        + '<div class="field">'
        + '<label class="field__label" for="mConfirm">Palabra de confirmación</label>'
        + '<input class="input input--mono" id="mConfirm" name="confirm" value="' + esc(f.confirm)
        + '" aria-describedby="mConfirmHelp" placeholder="A I S L A R" autocapitalize="characters">'
        + '<div class="friction-bar" aria-hidden="true" style="margin-top:8px"><div class="friction-bar__fill" style="width:' + pct + '%"></div></div>'
        + '<span class="field__hint" id="mConfirmHelp">Coincidencia literal, sin espacios. Distingue el compromiso consciente del operador.</span>'
        + '</div></div>'
        + '<div class="card__foot row row--between">'
        + '<button type="button" class="btn btn--ghost" data-action="iso-back">' + icon('back', 14) + 'Volver al paso 1</button>'
        + '<button type="button" class="btn btn--danger" data-action="iso-confirm"' + (matches ? '' : ' disabled aria-disabled="true"')
        + '>' + icon('lock', 16) + 'Ejecutar aislamiento</button>'
        + '</div></section>';
    }

    return ''
      + '<div class="view__head">'
      + '<div><h1 class="view__title">Aislamiento seguro de cuentas en 2 pasos</h1>'
      + '<p class="view__lede">Cumplimiento de los requisitos <strong>FR-005</strong>, <strong>FR-006</strong> y la regla de negocio '
      + '<strong>BR-001</strong> (cero bloqueos autónomos). Ninguna cuenta clínica se aísla sin justificación documentada, '
      + 're-autenticación del Coordinador SOC y escritura literal de confirmación.</p></div></div>'

      + '<section class="grid grid--kpi" aria-label="Indicadores de aislamiento" style="margin-bottom:24px">'
      + U.kpi('info', 'shield', 'Umbral auto-bloqueo', D.THRESHOLD.toFixed(2), 'BR-001 · Cero bloqueo autónomo')
      + U.kpi('ok', 'lock', 'Cuentas aisladas', String(Object.keys(state.isolated).length + 1), 'Cuarentena simulada en PostgreSQL')
      + U.kpi('warn', 'key', 'Pasos de fricción', '2 pasos', 'Justificación + palabra AISLAR')
      + U.kpi('critical', 'hospital', 'Unidades exentas', '3 unidades', 'UCI · Quirófano · Urgencias')
      + '</section>'

      + '<div class="grid grid--detail">'
      + '<div class="stack">' + stepPanel + '</div>'
      + '<div class="stack sticky-col">'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Garantías del protocolo</h2>'
      + '<span class="tag">' + icon('gavel', 12) + 'Ley 1581 · HIPAA</span></div>'
      + '<div class="card__body stack stack--sm">'
      + '<ul class="impactlist">'
      + '<li>' + icon('check', 14) + '<span><strong>Paso 1 (Justificación y Re-auth):</strong> Exige motivo ≥ 30 caracteres y validación de credenciales del Coordinador SOC.</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Paso 2 (Fricción Cognitiva):</strong> El botón destructivo permanece bloqueado hasta teclear <code class="mono">AISLAR</code>.</span></li>'
      + '<li>' + icon('triangle', 14) + '<span><strong>Salvaguarda BR-002:</strong> Antes de iniciar el Paso 1, el motor verifica que la cuenta no pertenezca a UCI, Quirófano ni Urgencias.</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Persistencia ACID:</strong> Registra la acción en <code class="mono">QUARANTINE_ACTIONS</code> y <code class="mono">AUDIT_LOGS</code>.</span></li>'
      + '</ul></div></section>'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Impacto clínico controlado</h2></div>'
      + '<div class="card__body"><dl class="dl">'
      + U.dlRow('Modo de ejecución', 'Simulación en BD local (MVP)')
      + U.dlRow('Reversibilidad', 'Inmediata desde ficha forense')
      + U.dlRow('Retención de evidencia', '180 días en Data Lake')
      + '</dl></div></section>'
      + '</div></div>';
  }

  /* -----------------------------------------------------------------------
     Vista 6 · Error unidad crítica BR-002 (Vista completa dedicada FR-007)
     --------------------------------------------------------------------- */
  function criticalUnitView(state, chrome) {
    const targetId = state.criticalTarget || 'enf.castillo';
    const u = D.USERS[targetId] || D.USERS['enf.castillo'];
    const role = D.ROLES[state.role];
    const alertObj = D.ALERTS.find(a => a.user === u.id) || D.ALERTS[1];

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Cumplimiento y Gobernanza', href: '#/error-unidad-critica' },
      { text: 'Restricción BR-002' }
    ], 'Restricción de bloqueo por unidad crítica (BR-002)',
      'FR-007 · BR-002 · Protección de continuidad clínica en soporte vital', 'error-unidad-critica');

    const critAccounts = Object.keys(D.USERS).filter(k => D.CRITICAL_UNITS.indexOf(D.USERS[k].unit) !== -1);

    return ''
      + '<div class="view__head">'
      + '<div>'
      + '<div class="row" style="gap:8px;margin-bottom:8px">'
      + '<span class="badge badge--outline-critical">' + icon('triangle', 13) + 'BR-002</span>'
      + '<span class="badge badge--critical">' + icon('lock', 13) + 'BLOQUEO DENEGADO POR SISTEMA</span>'
      + '</div>'
      + '<h1 class="view__title" id="mdTitle">No se puede aislar una cuenta de unidad crítica</h1>'
      + '<p class="view__lede" id="mdLede">Política de seguridad clínica del paciente (<strong>FR-007 / BR-002</strong>): el personal asignado a '
      + '<strong>UCI</strong>, <strong>Quirófano</strong> y <strong>Urgencias</strong> está estrictamente exento de bloqueos '
      + 'operativos por software para evitar interrupciones en actos médicos vitales.</p></div>'
      + '<div class="row">'
      + '<button type="button" class="btn btn--primary" data-action="revoke-session" data-user="' + esc(u.id) + '">'
      + icon('key', 16) + 'Revocar sólo la sesión sospechosa</button>'
      + '</div></div>'

      + '<section class="grid grid--kpi" aria-label="Unidades protegidas por BR-002" style="margin-bottom:24px">'
      + U.kpi('critical', 'hospital', 'UCI · Cuidados Intensivos', 'PROTEGIDA', 'Exención dura BR-002 activa')
      + U.kpi('critical', 'hospital', 'Quirófano · Cirugía', 'PROTEGIDA', 'Exención dura BR-002 activa')
      + U.kpi('critical', 'hospital', 'Urgencias · Reanimación', 'PROTEGIDA', 'Exención dura BR-002 activa')
      + U.kpi('info', 'gavel', 'Respuesta HTTP API', '422 BR_002', 'Rechazo auditado en BD')
      + '</section>'

      + '<div class="grid grid--detail">'
      + '<div class="stack modal" style="width:100%;max-height:none;box-shadow:none">'
      + '<div class="card__head">'
      + '<div><h2 class="h-card">Expediente de denegación normativa</h2>'
      + '<p class="meta">Simulación e inspección de cuentas asignadas a soporte vital</p></div>'
      + '<span class="badge badge--outline-critical">BR-002</span></div>'
      + '<div class="card__body stack stack--md">'
      + '<div class="field">'
      + '<span class="field__label">Inspeccionar cuenta en unidad crítica</span>'
      + '<div class="chipset" role="group" aria-label="Cuentas en unidades críticas">'
      + critAccounts.map(k =>
        '<button type="button" class="chip" data-crit-target="' + esc(k) + '" aria-pressed="' + (k === u.id) + '">'
        + esc(k) + ' · ' + esc(D.USERS[k].unit) + '</button>'
      ).join('')
      + '</div></div>'

      + U.notice('block', 'triangle',
        '<strong>El aislamiento por software está prohibido en unidades críticas.</strong> Una cuenta aislada durante un turno '
        + 'detiene la atención médica y el acceso a historia clínica o bombas de infusión: el bloqueo se convierte en el incidente. '
        + 'La plataforma rechaza la operación sin excepción ni bypass.')

      + '<div class="summarybox">'
      + U.summaryRow('Cuenta protegida', esc(u.full))
      + U.summaryRow('Identificador', '<span class="mono">' + esc(u.id) + '</span>')
      + U.summaryRow('Rol clínico', esc(u.job))
      + U.summaryRow('Unidad vital', '<span class="badge badge--outline-critical">' + icon('triangle', 13) + esc(u.unit.toUpperCase()) + '</span>')
      + U.summaryRow('Ubicación / Turno', esc(u.floor) + ' · ' + esc(u.shift))
      + U.summaryRow('Incidente asociado', '<span class="mono">' + esc(alertObj.id) + '</span> · puntaje <span class="mono">' + alertObj.risk.toFixed(2) + ' / 1.00</span>')
      + U.summaryRow('Operador en sesión', esc(role.name) + ' · ' + esc(role.label))
      + '</div>'

      + '<div>'
      + '<p class="label-caps" style="margin-bottom:8px">Vías de mitigación alternativas autorizadas</p>'
      + '<ul class="impactlist">'
      + '<li>' + icon('check', 14) + '<span><strong>Revocar sólo la sesión sospechosa (' + esc(alertObj.ip) + '):</strong> Cierra el token externo sin bloquear la terminal clínica intrahospitalaria del turno.</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Forzar desafío MFA en reconexión:</strong> Exige segundo factor únicamente fuera de la intranet hospitalaria (<code class="mono">10.20.0.0/16</code>).</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Escalamiento inmediato al CISO y Jefe de Servicio:</strong> Verificación presencial en piso antes de cualquier cambio de credencial.</span></li>'
      + '</ul></div>'
      + '</div>'
      + '<div class="card__foot row row--between">'
      + '<span class="tiny mono">bitácora: QUARANTINE_ACTIONS.blocked_due_to_critical_unit = TRUE</span>'
      + '<div class="row">'
      + '<button type="button" class="btn btn--secondary" data-action="escalate">' + icon('shield', 15) + 'Escalar al CISO</button>'
      + '<a class="btn btn--ghost" href="#/alerta/' + esc(alertObj.id) + '">Abrir detalle de ' + esc(alertObj.id) + '</a>'
      + '</div></div></div>'

      + '<div class="stack sticky-col">'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Unidades exceptuadas (Catálogo UNITS)</h2></div>'
      + '<div class="card__body stack stack--sm">'
      + D.CRITICAL_UNITS.map(unitName =>
        '<div class="summarybox">'
        + '<div class="row row--between"><span class="badge badge--outline-critical">' + icon('triangle', 13) + esc(unitName.toUpperCase()) + '</span>'
        + '<span class="mono tiny">is_critical = true</span></div>'
        + '<p class="meta">Protección dura en base de datos y capa de servicio (<code class="mono">HTTP 422 BR_002_VIOLATION</code>).</p>'
        + '</div>'
      ).join('')
      + '</div></section>'
      + '</div></div>';
  }

  /* -----------------------------------------------------------------------
     Vista 7 · Matriz de trazabilidad normativa (#/trazabilidad)
     --------------------------------------------------------------------- */
  function traceabilityView(state, chrome) {
    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Cumplimiento y Gobernanza', href: '#/trazabilidad' },
      { text: 'Matriz de trazabilidad' }
    ], 'Matriz de trazabilidad de requisitos y reglas clínicas',
      'SRS HeraUEBA · Ley 1581 de 2012 · HIPAA · Cobertura 100 % verificada', 'trazabilidad');

    const frRows = [
      ['FR-001', 'Visualización priorizada de Alertas Rojas', 'US-001', 'Dashboard (#/dashboard) · zona crítica sobre el pliegue (< 900px)', 'T-07 (Puppeteer)', 'CUBIERTO'],
      ['FR-002', 'Filtro temporal por defecto (24 horas)', 'US-002', 'GET /api/v1/alerts (window_hours=24) + chips interactivos 1h/24h/7d/30d', 'T-01 (Pytest)', 'CUBIERTO'],
      ['FR-003', 'Filtro histórico por usuario (180 días)', 'US-003', 'GET /api/v1/forensics/users/{u} + vista #/historial interactiva', 'T-06 (Pytest)', 'CUBIERTO'],
      ['FR-004', 'Explicabilidad del modelo (Caja Blanca)', 'US-004', 'GET /api/v1/alerts/{id}/decision-path + panel de nodos N1–N5', 'T-02 (Pytest)', 'CUBIERTO'],
      ['FR-005', 'Interfaz de aislamiento simulado', 'US-005', 'POST /api/v1/actions/isolate + vista #/aislamiento y modal', 'T-05 (Pytest)', 'CUBIERTO'],
      ['FR-006', 'Verificación de dos pasos para aislamiento', 'US-005', 'Paso 1 (motivo ≥ 30 car. + re-auth) y Paso 2 (palabra literal AISLAR)', 'T-05 / E2E', 'CUBIERTO'],
      ['FR-007', 'Restricción de bloqueo por unidad crítica', 'US-005', 'Rechazo HTTP 422 BR_002_VIOLATION en UCI, Quirófano y Urgencias', 'T-04 (Pytest)', 'CUBIERTO'],
      ['FR-008', 'Gestión de Whitelist geográfica (CRUD)', 'US-006', 'GET/POST/DELETE /api/v1/whitelist con validación CIDR IPv4 y vigencia', 'T-06 (Pytest)', 'CUBIERTO']
    ];

    const nfrRows = [
      ['NFR-001', 'Eficiencia y reducción de MTTR (> 70 %)', 'Valid-001', 'Triaje en primer viewport + árbol explicable + acción en < 45 min', 'Flujo E2E', 'CUBIERTO'],
      ['NFR-002', 'Usabilidad de baja densidad cognitiva', 'US-001', 'Cero gráficos decorativos; cifras tabulares; máx. 1 acción primaria', 'T-07 / T-08', 'CUBIERTO'],
      ['NFR-003', 'Control de acceso basado en roles (RBAC)', 'US-005', 'Coordinador SOC aísla; Analista Junior/Senior recibe HTTP 403 Forbidden', 'T-03 (Pytest)', 'CUBIERTO'],
      ['NFR-004', 'Trazabilidad y cumplimiento (Ley 1581 / HIPAA)', 'US-004', 'Persistencia relacional en DECISION_PATHS, QUARANTINE_ACTIONS y AUDIT_LOGS', 'T-02 / T-05', 'CUBIERTO'],
      ['BR-001', 'Cero tolerancia a bloqueos automáticos', 'BP-002', 'Umbral parametrizado en 0.98 > máx. score 0.94; exige intervención humana', 'Invariante BD/API', 'CUBIERTO'],
      ['BR-002', 'Exención estricta de unidades críticas', 'BP-002', 'Unidades UCI, Quirófano y Urgencias marcadas is_critical=TRUE sin bypass', 'T-04 / E2E', 'CUBIERTO']
    ];

    return ''
      + '<div class="view__head">'
      + '<div><h1 class="view__title">Matriz de trazabilidad normativa y técnica</h1>'
      + '<p class="view__lede">Vinculación formal entre la Especificación de Requisitos de Software (<code class="mono">docs/srs_heraueba.md</code>), '
      + 'las Historias de Usuario (<code class="mono">docs/historias_usuario.md</code>), los endpoints REST (<code class="mono">/api/v1</code>) '
      + 'y las pruebas automatizadas de verificación.</p></div>'
      + '<a class="btn btn--primary" href="#/dashboard">' + icon('grid', 16) + 'Volver al monitoreo</a>'
      + '</div>'

      + '<section class="grid grid--kpi" aria-label="Resumen de cobertura normativa" style="margin-bottom:24px">'
      + U.kpi('ok', 'check', 'Requisitos Funcionales', '8 / 8', 'FR-001 a FR-008 verificados')
      + U.kpi('ok', 'shield', 'Requisitos No Funcionales', '4 / 4', 'NFR-001 a NFR-004 activos')
      + U.kpi('critical', 'gavel', 'Reglas de Negocio', '2 / 2', 'BR-001 y BR-002 en backend y UI')
      + U.kpi('info', 'activity', 'Pruebas Automatizadas', '8 suites', 'T-01 a T-08 (Pytest + Puppeteer)')
      + '</section>'

      + '<section class="card" style="margin-bottom:24px" aria-labelledby="tablaFR">'
      + '<div class="card__head"><div><h2 class="h-card" id="tablaFR">1. Requisitos Funcionales (FR-001 a FR-008)</h2>'
      + '<p class="meta">Trazabilidad extremo a extremo desde historias de usuario hasta base de datos PostgreSQL</p></div>'
      + '<span class="tag">' + icon('check', 12) + '100 % cubierto</span></div>'
      + '<div class="tablewrap"><table class="table">'
      + '<thead><tr><th>ID</th><th>Requisito funcional</th><th>Historia</th><th>Implementación (API + Vista)</th><th>Prueba</th><th>Estado</th></tr></thead>'
      + '<tbody>'
      + frRows.map(r =>
        '<tr>'
        + '<td data-label="ID"><span class="mono" style="font-weight:600">' + esc(r[0]) + '</span></td>'
        + '<td data-label="Requisito">' + esc(r[1]) + '</td>'
        + '<td data-label="Historia"><span class="tag">' + esc(r[2]) + '</span></td>'
        + '<td data-label="Implementación"><span class="meta" style="color:var(--on-surface)">' + esc(r[3]) + '</span></td>'
        + '<td data-label="Prueba"><span class="mono tiny">' + esc(r[4]) + '</span></td>'
        + '<td data-label="Estado"><span class="badge badge--ok">' + icon('check', 13) + esc(r[5]) + '</span></td>'
        + '</tr>'
      ).join('')
      + '</tbody></table></div></section>'

      + '<section class="card" aria-labelledby="tablaNFR">'
      + '<div class="card__head"><div><h2 class="h-card" id="tablaNFR">2. Requisitos No Funcionales y Reglas de Negocio (NFR / BR)</h2>'
      + '<p class="meta">Seguridad clínica, RBAC, baja densidad cognitiva y cumplimiento Ley 1581 de 2012 / HIPAA</p></div>'
      + '<span class="tag">' + icon('shield', 12) + 'Auditoría activa</span></div>'
      + '<div class="tablewrap"><table class="table">'
      + '<thead><tr><th>ID</th><th>Declaración normativa</th><th>Proceso / US</th><th>Mecanismo de control</th><th>Verificación</th><th>Estado</th></tr></thead>'
      + '<tbody>'
      + nfrRows.map(r =>
        '<tr>'
        + '<td data-label="ID"><span class="mono" style="font-weight:600">' + esc(r[0]) + '</span></td>'
        + '<td data-label="Declaración">' + esc(r[1]) + '</td>'
        + '<td data-label="Proceso"><span class="tag">' + esc(r[2]) + '</span></td>'
        + '<td data-label="Control"><span class="meta" style="color:var(--on-surface)">' + esc(r[3]) + '</span></td>'
        + '<td data-label="Verificación"><span class="mono tiny">' + esc(r[4]) + '</span></td>'
        + '<td data-label="Estado"><span class="badge badge--ok">' + icon('check', 13) + esc(r[5]) + '</span></td>'
        + '</tr>'
      ).join('')
      + '</tbody></table></div></section>';
  }

  /* -----------------------------------------------------------------------
     Vista 8 · Configurar cuenta (#/perfil)
     --------------------------------------------------------------------- */
  function profileView(state, chrome) {
    const r = D.ROLES[state.role];

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Configurar cuenta' }
    ], 'Configuración de cuenta del operador SOC',
      r.name + ' · ' + r.label + ' · ' + (r.institution || 'Clínica Central'), 'perfil');

    const avatarContent = r.avatarUrl
      ? '<img src="' + esc(r.avatarUrl) + '" alt="Foto de perfil de ' + esc(r.name) + '">'
      : esc(r.initials);

    return ''
      + '<div class="view__head">'
      + '<div><h1 class="view__title">Configurar cuenta y perfil institucional</h1>'
      + '<p class="view__lede">Actualiza tu fotografía de perfil, nombre completo, institución o empresa de salud, correo electrónico, '
      + 'teléfono de guardia y turno operativo. Los cambios se sincronizan en PostgreSQL y en la bitácora de auditoría.</p></div></div>'

      + '<div class="grid grid--split">'
      + '<section class="card">'
      + '<div class="card__head"><h2 class="h-card">Datos del perfil del operador</h2>'
      + '<span class="badge badge--context">' + icon('shield', 13) + esc(r.label) + '</span></div>'
      + '<form class="card__body stack stack--md" id="profileForm" novalidate>'

      + '<div class="row" style="gap:16px;padding-bottom:12px;border-bottom:1px solid var(--outline)">'
      + '<div class="avatar-preview" id="profileAvatarPreview">' + avatarContent + '</div>'
      + '<div class="grow stack stack--sm">'
      + '<label class="field"><span class="field__label">Imagen de perfil (subir fotografía o pegar URL)</span>'
      + '<input class="input" type="file" id="pAvatarFile" accept="image/*" style="padding:6px 12px">'
      + '</label>'
      + '<input class="input input--mono" type="url" name="avatar_url" id="pAvatarUrl" value="' + esc(r.avatarUrl || '') + '" placeholder="https://ejemplo.org/avatar.png o selecciona un archivo arriba">'
      + '</div></div>'

      + '<div class="grid grid--2">'
      + '<label class="field"><span class="field__label">Nombre completo <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input" type="text" name="full_name" id="pFullName" value="' + esc(r.name) + '" required>'
      + '</label>'
      + '<label class="field"><span class="field__label">Institución o empresa <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input" type="text" name="institution" id="pInstitution" value="' + esc(r.institution || 'Clínica Central · Nodo SOC-BOG-01') + '" required>'
      + '</label>'
      + '</div>'

      + '<div class="grid grid--2">'
      + '<label class="field"><span class="field__label">Correo electrónico institucional <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input input--mono" type="email" name="email" id="pEmail" value="' + esc(r.mail) + '" required>'
      + '</label>'
      + '<label class="field"><span class="field__label">Teléfono de contacto / Guardia <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input input--mono" type="tel" name="phone" id="pPhone" value="' + esc(r.phone || '+57 310 482 9104') + '" required>'
      + '</label>'
      + '</div>'

      + '<div class="grid grid--2">'
      + '<label class="field"><span class="field__label">Cargo / Rol asignado (RBAC)</span>'
      + '<input class="input" type="text" name="job_title" id="pJobTitle" value="' + esc(r.label) + '" readonly aria-readonly="true" style="background:var(--surface-dim)">'
      + '</label>'
      + '<label class="field"><span class="field__label">Horario / Turno operativo</span>'
      + '<input class="input" type="text" name="shift_schedule" id="pShift" value="' + esc(r.shift || 'Permanente · Guardia Resolutiva') + '">'
      + '</label>'
      + '</div>'

      + '<div class="row row--between" style="padding-top:8px">'
      + '<a class="btn btn--secondary" href="#/dashboard">Cancelar y volver</a>'
      + '<button type="submit" class="btn btn--primary">' + icon('check', 16) + 'Guardar cambios del perfil</button>'
      + '</div>'
      + '</form></section>'

      + '<div class="stack sticky-col">'
      + '<section class="card"><div class="card__head"><h2 class="h-sub">Estado de seguridad de la sesión</h2></div>'
      + '<div class="card__body"><dl class="dl">'
      + U.dlRow('Usuario de dominio', '<span class="mono">' + esc(r.username || state.role) + '</span>')
      + U.dlRow('Rol RBAC activo', esc(r.label))
      + U.dlRow('Permiso de aislamiento', r.canIsolate
        ? '<span class="badge badge--ok">' + icon('check', 13) + 'HABILITADO</span>'
        : '<span class="badge badge--neutral">' + icon('lock', 13) + 'RESTRINGIDO (NFR-003)</span>')
      + U.dlRow('Segundo factor (MFA)', '<span class="badge badge--ok">' + icon('check', 13) + 'FIDO2 / KEYCLOAK</span>')
      + U.dlRow('Nodo conectado', '<span class="mono">SOC-BOG-01 (TLS 1.3)</span>')
      + '</dl>'
      + '<div style="margin-top:16px">'
      + '<button type="button" class="btn btn--danger btn--block" data-action="logout">' + icon('logout', 16) + 'Cerrar sesión activa</button>'
      + '</div></div></section>'
      + '</div></div>';
  }

  /* -----------------------------------------------------------------------
     Vista 9 · Inicio de Sesión SOC (#/login)
     Soporta Coordinador SOC y Analista SOC (Junior y Senior).
     --------------------------------------------------------------------- */
  function loginView(state) {
    const selectedRole = state.loginFormRole || state.role || 'coordinador';
    const r = D.ROLES[selectedRole] || D.ROLES.coordinador;

    const roleOptions = [
      {
        key: 'coordinador',
        title: 'Coordinador SOC (Resolutivo)',
        user: 'carla.restrepo@hospital.local',
        desc: 'Carla M. Restrepo · Facultada para ejecutar aislamiento en 2 pasos (FR-005/006) y administrar Whitelist (FR-008).'
      },
      {
        key: 'junior',
        title: 'Analista SOC · Nivel Junior',
        user: 'diego.fuentes@hospital.local',
        desc: 'Diego A. Fuentes · Monitoreo de alertas críticas en turno, inspección de caja blanca y exportación. Sin bloqueo (NFR-003).'
      },
      {
        key: 'senior',
        title: 'Analista SOC · Nivel Senior',
        user: 'valeria.soto@hospital.local',
        desc: 'Ing. Valeria Soto M. · Investigación forense de 180 días, correlación de telemetría y escalamiento al CISO. Sin bloqueo (NFR-003).'
      }
    ];

    return ''
      + '<div class="login-wrap">'
      + '<section class="card card--raised">'
      + '<div class="card__head" style="background:var(--primary);color:#FFFFFF;border-radius:var(--r-md) var(--r-md) 0 0;padding:20px 24px">'
      + '<div class="row" style="gap:12px">'
      + '<span class="rail__mark" aria-hidden="true">' + icon('shield', 18) + '</span>'
      + '<div><h1 class="h-card" style="color:#FFFFFF">HeraUEBA · Consola Clínica SOC</h1>'
      + '<p class="tiny" style="color:rgba(255,255,255,0.82)">Autenticación Federada Keycloak SSO · Clínica Central · Nodo SOC-BOG-01</p></div>'
      + '</div></div>'

      + '<form class="card__body stack stack--md" id="loginForm" novalidate>'
      + U.notice('rule', 'shield',
        '<strong>Control de acceso basado en roles (NFR-003).</strong> Selecciona el perfil operativo con el que deseas iniciar turno: '
        + '<strong>Coordinador SOC</strong> o <strong>Analista SOC (Junior / Senior)</strong>.')

      + '<div class="field">'
      + '<span class="field__label">Rol y operador de turno <span class="field__req" aria-hidden="true">*</span></span>'
      + '<div class="role-picker" role="radiogroup" aria-label="Seleccionar rol de inicio de sesión">'
      + roleOptions.map(opt =>
        '<label class="role-option" data-selected="' + (selectedRole === opt.key) + '">'
        + '<input type="radio" name="login_role" value="' + esc(opt.key) + '"' + (selectedRole === opt.key ? ' checked' : '') + '>'
        + '<div class="grow">'
        + '<div class="row row--between"><strong style="font-size:14px">' + esc(opt.title) + '</strong>'
        + '<span class="mono tiny">' + esc(opt.user) + '</span></div>'
        + '<p class="meta" style="margin-top:4px">' + esc(opt.desc) + '</p>'
        + '</div></label>'
      ).join('')
      + '</div></div>'

      + '<div class="grid grid--2">'
      + '<label class="field"><span class="field__label">Cuenta institucional</span>'
      + '<input class="input input--mono" type="email" name="username" id="lUser" value="' + esc(r.mail) + '" required>'
      + '</label>'
      + '<label class="field"><span class="field__label">Contraseña de dominio <span class="field__req" aria-hidden="true">*</span></span>'
      + '<input class="input" type="password" name="password" id="lPass" value="demo-pass-2026" required>'
      + '</label>'
      + '</div>'

      + '<span class="field__error" id="lErr" hidden></span>'

      + '<button type="submit" class="btn btn--primary btn--block">'
      + icon('lock', 16) + 'Iniciar sesión en el SOC</button>'
      + '</form>'
      + '<div class="card__foot row row--between">'
      + '<span>' + icon('info', 13) + ' Cumplimiento normativo Ley 1581 de 2012 · HIPAA Security Rule</span>'
      + '<span class="mono tiny"> demo-pass-2026</span>'
      + '</div></section></div>';
  }

  return {
    dashboard,
    alertDetail,
    whitelist,
    history,
    isolationView,
    criticalUnitView,
    traceabilityView,
    profileView,
    loginView
  };
})();
