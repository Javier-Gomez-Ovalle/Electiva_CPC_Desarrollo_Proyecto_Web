/* =========================================================================
   HeraUEBA · views.js
   Renderizadores de las vistas del prototipo. Cada función devuelve el HTML
   de la vista y actualiza la barra superior (migas, título, rail activo).
   ========================================================================= */
window.VIEWS = (function () {
  'use strict';

  const D = window.HERA, U = window.UI;
  const esc = U.esc, icon = D.icon;

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
    const medium = 12 - crit.length;

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Monitoreo' }
    ], 'Dashboard de monitoreo UEBA',
      'Clínica Central · Nodo SOC-BOG-01 · ' + crit.length + ' alertas críticas en ventana',
      'dashboard');

    const opt = (v, label, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + label + '</option>';

    return ''
      + '<div class="view__head">'
      + '<div><h1 class="view__title">Alertas de comportamiento · ventana de ' + h + ' h</h1>'
      + '<p class="view__lede">La zona crítica se resuelve antes de cualquier desplazamiento: el analista debe poder triar las '
      + crit.length + ' alertas rojas sin hacer scroll. La cola de análisis queda deliberadamente debajo del pliegue.</p></div>'
      + '<button type="button" class="btn btn--primary" data-action="only-critical">'
      + icon('triangle', 16) + 'Revisar las ' + crit.length + ' críticas</button>'
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
      + U.kpi('warn', 'circleDot', 'Alertas medias', String(medium), 'En observación activa')
      + U.kpi('ok', 'lock', 'Cuentas aisladas', String(isolatedTotal), 'Aislamiento manual confirmado')
      + U.kpi('info', 'activity', 'Inicios de sesión', '4 812', 'Ingesta Keycloak activa')
      + '</section>'

      /* --- Zona crítica, sin desplazamiento --- */
      + '<section class="card" style="margin-bottom:24px" aria-labelledby="zonaCritica">'
      + '<div class="card__head">'
      + '<div><h2 class="h-card" id="zonaCritica">Alertas rojas activas '
      + '<span class="badge badge--critical" style="margin-left:8px;vertical-align:middle">' + crit.length + '</span></h2>'
      + '<p class="meta">Prioridad alta e inmediata · ventana de ' + h + ' h · ordenadas por puntaje de riesgo</p></div>'
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
        : '<tr><td colspan="8"><p class="meta" style="padding:24px;text-align:center">La cola está vacía con los filtros actuales.</p></td></tr>')
      + '</tbody></table></div>'
      + '<div class="card__foot row row--between">'
      + '<span>' + icon('arrowDown', 13) + ' ' + medium
      + ' alertas de prioridad media e informativa permanecen bajo el pliegue: la zona crítica nunca compite por atención.</span>'
      + '<span class="mono tiny">retención 180 d</span></div></section>';
  }

  /* -----------------------------------------------------------------------
     Vista 2 · Detalle de alerta con caja blanca
     --------------------------------------------------------------------- */
  function alertDetail(id, state, chrome) {
    const a = D.ALERTS.find(x => x.id === id) || D.ALERTS[0];
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

    /* Acción dominante: destructiva. Nunca aparece junto a un botón primario. */
    const btnAttrs = role.canIsolate ? '' : ' disabled aria-disabled="true"';
    const isolateBtn = '<button type="button" class="btn btn--danger" data-action="try-isolate" data-user="'
      + esc(a.user) + '"' + btnAttrs + '>' + icon('lock', 16) + 'Aislar usuario</button>';

    let help;
    if (!role.canIsolate) {
      help = '<p class="hint">' + icon('info', 14) + '<span>Bloqueado por rol: el aislamiento de cuentas exige el rol '
        + '<strong>Coordinador SOC</strong>. Tu sesión activa es <strong>' + esc(role.label)
        + '</strong>, que puede investigar, copiar evidencia y escalar, pero no mitig.</span></p>';
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
      /* Tabla */
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

      /* Alta */
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
     Vista 4 · Historial de usuario
     --------------------------------------------------------------------- */
  function history(state, chrome) {
    const id = state.history.user;
    const u = D.USERS[id];
    const h = D.HISTORY[id];
    const events = D.eventsFor((D.ALERTS.find(a => a.user === id) || {}).id);
    const role = D.ROLES[state.role];

    chrome([
      { text: 'SOC Salud', href: '#/dashboard' },
      { text: 'Historial de usuario' }
    ], 'Historial forense de ' + id, u.full + ' · ' + u.dept, 'historial');

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
      + [['24h', '24 h'], ['7d', '7 días'], ['30d', '30 días'], ['full', 'Histórico completo']]
        .map(p => '<button type="button" class="chip" data-hwin="' + p[0] + '" aria-pressed="'
          + (state.history.window === p[0]) + '">' + p[1] + '</button>').join('')
      + '</div></div>'
      + '<div class="filterbar__fields">'
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
      + 'la retención completa de 180 días almacenada en el data lake. Identidad de la sesión: ' + esc(role.name) + '.</span></p>'
      + '</section>'

      + '<section class="grid grid--kpi" aria-label="Indicadores de la cuenta" style="margin-bottom:24px">'
      + U.kpi('info', 'activity', 'Eventos totales', h.total.toLocaleString('es-CO'), 'Retención 180 días')
      + U.kpi('ok', 'check', 'Inicios de sesión', h.logins.toLocaleString('es-CO'), '47.6 % del volumen')
      + U.kpi('warn', 'triangle', 'Fallos de autenticación', String(h.fails), '14 ráfagas recientes')
      + U.kpi('info', 'globe', 'Países distintos', String(h.countries.split(',').length), esc(h.countries))
      + '</section>'

      + '<div class="grid grid--detail">'
      + '<section class="card"><div class="card__head">'
      + '<div><h2 class="h-card">Línea de tiempo de eventos</h2>'
      + '<p class="meta">Mostrando ' + events.length + ' de ' + h.total.toLocaleString('es-CO') + ' eventos</p></div>'
      + '<span class="tag">' + icon('server', 12) + 'data lake · nodo 3</span></div>'
      + '<div class="card__body">' + U.timeline(events, true) + '</div></section>'

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

  return { dashboard, alertDetail, whitelist, history };
})();
