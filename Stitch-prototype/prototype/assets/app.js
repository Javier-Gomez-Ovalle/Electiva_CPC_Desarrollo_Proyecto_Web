/* =========================================================================
   HeraUEBA · app.js
   Estado, enrutado por hash y enlace de eventos del prototipo.
   ========================================================================= */
(function () {
  'use strict';

  const D = window.HERA, U = window.UI, V = window.VIEWS, M = window.MODALS;
  const esc = U.esc, icon = D.icon;

  /* --- Estado ------------------------------------------------------------ */
  const state = {
    role: 'coordinador',
    window: 24,
    risk: 'all',
    unit: 'all',
    country: 'all',
    onlyCritical: false,
    history: { user: 'mg.ramirez', window: '24h', type: 'all', result: 'all' },
    isolation: { step: 1, target: 'mg.ramirez', reason: '', reauth: '', notify: false, evidence: false, confirm: '', errors: {} },
    isolated: {},
    wl: D.WHITELIST.map(w => Object.assign({}, w)),
    visibleAlerts: D.ALERTS.slice()
  };

  /* --- Utilidades DOM ---------------------------------------------------- */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));

  function toast(kind, title, body) {
    const el = document.createElement('div');
    el.className = 'toast toast--' + (kind || 'ok');
    el.innerHTML = (kind === 'warn' ? icon('triangle', 18) : kind === 'info' ? icon('info', 18) : icon('check', 18))
      + '<div><p class="toast__title">' + esc(title) + '</p>'
      + (body ? '<p class="toast__body">' + esc(body) + '</p>' : '') + '</div>';
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 150ms'; }, 4200);
    setTimeout(() => el.remove(), 4400);
  }

  function copyText(text, label) {
    const done = () => toast('ok', label + ' copiado al portapapeles');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
      } catch (e) { toast('warn', 'El navegador bloqueó el portapapeles'); }
    }
  }

  /* --- Cálculo de la vista de alertas ------------------------------------ */
  function computeVisible() {
    state.visibleAlerts = D.ALERTS.filter(a => {
      if (state.onlyCritical && a.sev !== 'critico') return false;
      if (state.risk === 'alta' && a.risk < 0.85) return false;
      if (state.risk === 'media' && (a.risk < 0.5 || a.risk >= 0.85)) return false;
      if (state.risk === 'baja' && a.risk >= 0.5) return false;
      if (state.unit !== 'all' && D.USERS[a.user].dept !== state.unit) return false;
      if (state.country !== 'all' && a.cc !== state.country) return false;
      return true;
    });
  }

  /* --- Cromo superior ---------------------------------------------------- */
  function chrome(crumbs, title, sub, navKey) {
    $('#crumbs').innerHTML = crumbs.map((c, i) =>
      (c.href ? '<a href="' + c.href + '">' + esc(c.text) + '</a>' : '<span>' + esc(c.text) + '</span>')
      + (i < crumbs.length - 1 ? '<span class="crumbs__sep" aria-hidden="true">/</span>' : '')
    ).join('');
    $('#topbarTitle').textContent = title;
    $('#topbarSub').textContent = sub || 'Clínica Central · Nodo SOC-BOG-01 · TLS 1.3';
    $$('#nav .navlink').forEach(a => {
      if (a.dataset.nav === navKey) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const n = D.ALERTS.filter(a => a.sev === 'critico' && !state.isolated[a.user]).length;
    const bc = $('#navCriticalCount');
    bc.textContent = n;
    bc.style.display = n ? '' : 'none';
  }

  function syncRole() {
    const r = D.ROLES[state.role];
    $('#roleName').textContent = r.name;
    $('#roleLabel').textContent = r.label;
    $('#roleAvatar').textContent = r.initials;
    $$('.seg__btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === state.role)));
  }

  /* --- Enrutado ---------------------------------------------------------- */
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {};
    (query || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      q[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { parts, q };
  }

  function render() {
    computeVisible();

    /* Un modal abierto no puede sobrevivir a un cambio de ruta: el velo
       bloquearía la vista nueva. Las rutas que abren un modal lo vuelven
       a abrir más abajo, ya con la vista correcta debajo. */
    if (document.getElementById('modalRoot').innerHTML) M.close();

    const { parts, q } = parseHash();
    const root = parts[0] || 'dashboard';
    const view = $('#view');

    switch (root) {
      case 'alerta':
        view.innerHTML = V.alertDetail(parts[1], state, chrome);
        break;
      case 'whitelist':
        view.innerHTML = V.whitelist(state, chrome);
        break;
      case 'historial':
        if (q.u && D.USERS[q.u]) state.history.user = q.u;
        view.innerHTML = V.history(state, chrome);
        break;
      case 'aislamiento':
        state.isolation.step = 1;
        state.isolation.target = 'mg.ramirez';
        view.innerHTML = V.alertDetail('INC-2026-0417', state, chrome);
        M.isolationStep1(state, 'mg.ramirez');
        break;
      case 'error-unidad-critica':
        view.innerHTML = V.alertDetail('INC-2026-0418', state, chrome);
        M.criticalUnit(state, 'enf.castillo');
        break;
      default:
        view.innerHTML = V.dashboard(state, chrome);
    }

    view.scrollTop = 0;
    view.focus({ preventScroll: true });
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  /* --- Acciones ---------------------------------------------------------- */
  function requestIsolation(userId) {
    /* BR-002 se comprueba antes que el RBAC: es una restricción del sistema,
       no una permiso, y aplica a todos los roles por igual. */
    if (D.CRITICAL_UNITS.indexOf(D.USERS[userId].unit) !== -1) {
      M.criticalUnit(state, userId);
      return;
    }
    state.isolation = { step: 1, target: userId, reason: '', reauth: '', notify: false, evidence: false, confirm: '', errors: {} };
    M.isolationStep1(state, userId);
  }

  function validateStep1() {
    const f = state.isolation;
    const errors = {};
    if (!f.reason || f.reason.trim().length < 30) errors.reason = 'Describe el motivo en al menos 30 caracteres: es el texto que verá el jefe de servicio y el titular.';
    if (!f.reauth || f.reauth.length < 6) errors.reauth = 'La re-autenticación no coincide con la contraseña de dominio.';
    state.isolation.errors = errors;
    return Object.keys(errors).length === 0;
  }

  function renderIsolationStep2() {
    M.isolationStep2(state, state.isolation.target);
  }

  function executeIsolation() {
    const id = state.isolation.target;
    state.isolated[id] = true;
    M.close();
    toast('ok', 'Cuenta ' + id + ' aislada',
      'Motivo y evidencia registrados en bitácora. Reversión disponible desde la ficha del usuario.');
    go('#/historial?u=' + encodeURIComponent(id));
  }

  /* --- Validación del formulario de whitelist ---------------------------- */
  const CIDR_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d|1\d|2\d|3[0-2]))?$/;

  function setFieldError(id, msg) {
    const err = document.getElementById(id);
    const input = document.querySelector('[aria-describedby~="' + id + '"]');
    if (msg) {
      err.innerHTML = icon('triangle', 14) + esc(msg);
      err.hidden = false;
      if (input) input.setAttribute('aria-invalid', 'true');
    } else {
      err.hidden = true;
      if (input) input.removeAttribute('aria-invalid');
    }
  }

  function submitWhitelist(form) {
    const cidr = form.cidr.value.trim();
    const country = form.country.value.trim();
    const until = form.until.value;
    const note = form.note.value.trim();
    let ok = true;

    if (!CIDR_RE.test(cidr)) {
      setFieldError('eCidr', 'Usa una dirección IPv4 con máscara CIDR, por ejemplo 190.24.0.0/16.');
      ok = false;
    } else if (state.wl.some(w => w.cidr === cidr)) {
      setFieldError('eCidr', 'Esta red ya existe en la whitelist.');
      ok = false;
    } else setFieldError('eCidr', '');

    if (country.length < 3) { setFieldError('eCountry', 'Indica el país o el ámbito institucional.'); ok = false; }
    else setFieldError('eCountry', '');

    if (!until) { setFieldError('eUntil', 'Una whitelist sin vigencia es una puerta trasera: fija una fecha.'); ok = false; }
    else setFieldError('eUntil', '');

    if (note.length < 15) { setFieldError('eNote', 'La justificación clínica es obligatoria y queda en el expediente.'); ok = false; }
    else setFieldError('eNote', '');

    if (!form.audit.checked) {
      toast('warn', 'Falta la confirmación clínica', 'Marca la casilla para dejar constancia de la revisión del comité.');
      return;
    }
    if (!ok) {
      toast('warn', 'Revisa los campos marcados');
      const firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    state.wl.unshift({
      cidr: cidr, country: country, cc: country.slice(0, 3).toUpperCase(),
      scope: form.scope.value, note: note, until: until,
      by: D.ROLES[state.role].name, state: 'activa'
    });
    toast('ok', 'Entrada agregada a la whitelist', cidr + ' · ' + country + ' · vigente hasta ' + until);
    render();
  }

  function deleteWhitelist(cidr) {
    const before = state.wl.length;
    state.wl = state.wl.filter(w => w.cidr !== cidr);
    toast('ok', 'Entrada eliminada', before !== state.wl.length
      ? cidr + ' ya no se aplica. El registro de auditoría se conserva.'
      : 'No se encontró la entrada.');
    render();
  }

  /* --- Delegación de eventos --------------------------------------------- */
  document.addEventListener('click', ev => {
    const t = ev.target;

    /* Interruptor de rol */
    const seg = t.closest('.seg__btn');
    if (seg) {
      state.role = seg.dataset.role;
      syncRole();
      toast('info', 'Rol cambiado: ' + D.ROLES[state.role].label,
        D.ROLES[state.role].canIsolate
          ? 'Ahora puede ordenar el aislamiento de cuentas.'
          : 'El aislamiento de cuentas queda bloqueado por RBAC.');
      if (!document.getElementById('modalRoot').innerHTML) render();
      return;
    }

    /* Fila de tabla navegable */
    const row = t.closest('tr[data-goto]');
    if (row && !t.closest('a,button')) { go(row.dataset.goto); return; }

    /* Cierre de modal */
    if (t.closest('[data-close]')) {
      const goto = t.closest('[data-goto-after]');
      M.close();
      if (goto) go(goto.dataset.gotoAfter);
      return;
    }
    if (t.closest('[data-close-scrim]') && t === t.closest('[data-close-scrim]')) { M.close(); return; }

    /* Chips de ventana del dashboard */
    const chip = t.closest('[data-window]');
    if (chip) { state.window = Number(chip.dataset.window); render(); return; }

    /* Chips de la ventana del historial */
    const hwin = t.closest('[data-hwin]');
    if (hwin) { state.history.window = hwin.dataset.hwin; render(); return; }

    /* Chips de cuenta en el historial */
    const uchip = t.closest('[data-user]');
    if (uchip && uchip.classList.contains('chip')) {
      state.history.user = uchip.dataset.user;
      go('#/historial?u=' + encodeURIComponent(state.history.user));
      return;
    }

    /* Copias */
    const ctree = t.closest('[data-copy-tree]');
    if (ctree) {
      const a = D.ALERTS.find(x => x.id === ctree.dataset.copyTree);
      copyText(U.treeAsText(a), 'Ruta de decisión de ' + a.id);
      return;
    }
    const cinc = t.closest('[data-copy-inc]');
    if (cinc) {
      const a = D.ALERTS.find(x => x.id === cinc.dataset.copyInc);
      copyText(a.id + '\n' + a.rule + '\nscore ' + a.risk.toFixed(2) + '\n' + U.treeAsText(a), 'Incidente ' + a.id);
      return;
    }

    /* Botones de acción con parámetro */
    const act = t.closest('[data-action]');
    if (!act) return;
    const action = act.dataset.action;

    switch (action) {
      case 'only-critical':
        state.onlyCritical = !state.onlyCritical;
        toast('info', state.onlyCritical ? 'Mostrando sólo alertas críticas' : 'Mostrando todas las severidades');
        render();
        break;

      case 'try-isolate':
        requestIsolation(act.dataset.user || state.history.user);
        break;

      case 'iso-next':
        if (validateStep1()) { state.isolation.step = 2; renderIsolationStep2(); }
        else {
          renderIsolationStep1Preserving();
          toast('warn', 'Faltan requisitos para continuar');
        }
        break;

      case 'iso-back':
        state.isolation.step = 1;
        M.isolationStep1(state, state.isolation.target);
        break;

      case 'iso-confirm':
        executeIsolation();
        break;

      case 'escalate':
        toast('ok', 'Escalamiento enviado al CISO', 'Se abre el incidente con la caja blanca adjunta y la unidad en riesgo.');
        M.close();
        break;

      case 'revoke-session':
        toast('ok', 'Sesión sospechosa revocada', 'La cuenta conserva el acceso normal del turno; no se bloquea la unidad.');
        M.close();
        break;

      case 'open-ticket':
        toast('ok', 'Ticket de incidente abierto', 'El historial forense completo queda adjunto como evidencia.');
        break;

      case 'export':
        toast('ok', 'Exportación preparada', 'STIX 2.1 + JSON. En el MVP se descarga desde el endpoint de reporting.');
        break;

      case 'wl-toggle': {
        const w = state.wl.find(x => x.cidr === act.dataset.cidr);
        if (w) {
          w.state = w.state === 'activa' ? 'expirada' : 'activa';
          toast('info', w.state === 'activa' ? 'Entrada reactivada' : 'Entrada desactivada', w.cidr);
          render();
        }
        break;
      }

      case 'wl-del':
        M.confirmAction({
          icon: 'trash', action: 'wl-del-confirm', arg: act.dataset.cidr,
          title: 'Eliminar la entrada ' + act.dataset.cidr,
          lede: 'La red dejará de considerarse confiable para todo el hospital.',
          body: 'Las alertas que esta entrada suprimía volverán a aparecer. Para una retirada temporal usa <strong>Desactivar</strong>: '
            + 'conserva la entrada y su historial, que es lo que exige la auditoría.',
          confirmLabel: 'Eliminar entrada'
        });
        break;

      case 'wl-del-confirm':
        M.close();
        deleteWhitelist(act.dataset.arg);
        break;

      default:
        break;
    }
  });

  /* Re-render del paso 1 conservando lo escrito */
  function renderIsolationStep1Preserving() {
    M.isolationStep1(state, state.isolation.target);
  }

  /* --- Cambios de controles de formulario -------------------------------- */
  document.addEventListener('change', ev => {
    const t = ev.target;

    if (t.matches('[data-filter]')) {
      state[t.dataset.filter] = t.value;
      state.onlyCritical = false;
      render();
      return;
    }
    if (t.matches('[data-h]')) {
      state.history[t.dataset.h] = t.value;
      render();
      return;
    }
    if (t.id === 'wlForm') return;

    /* Campos del modal de aislamiento */
    if (t.id === 'mNotify') state.isolation.notify = t.checked;
    if (t.id === 'mEvidence') state.isolation.evidence = t.checked;
  });

  document.addEventListener('input', ev => {
    const t = ev.target;
    if (t.id === 'mReason') { state.isolation.reason = t.value; clearErr('mReasonErr', t); }
    if (t.id === 'mReauth') { state.isolation.reauth = t.value; clearErr('mReauthErr', t); }
    if (t.id === 'mConfirm') {
      state.isolation.confirm = t.value;
      /* Refresca la barra de fricción y el botón sin perder el foco. */
      const box = document.querySelector('.modal');
      if (box) {
        const ok = t.value.trim().toUpperCase() === 'AISLAR';
        const pct = ok ? 100 : t.value ? Math.min(90, Math.round(t.value.length / 5 * 90)) : 0;
        const bar = box.querySelector('.friction-bar__fill');
        if (bar) bar.style.width = pct + '%';
        const btn = box.querySelector('[data-action="iso-confirm"]');
        if (btn) {
          if (ok) btn.removeAttribute('disabled');
          else btn.setAttribute('disabled', 'aria-disabled');
        }
      }
    }
    /* Validación amable del formulario de whitelist */
    if (t.id === 'fCidr') clearErr('eCidr', t);
    if (t.id === 'fCountry') clearErr('eCountry', t);
    if (t.id === 'fNote') clearErr('eNote', t);
  });

  function clearErr(errId, input) {
    const e = document.getElementById(errId);
    if (e && !e.hidden) { e.hidden = true; input.removeAttribute('aria-invalid'); }
  }

  /* --- Envío del formulario de whitelist --------------------------------- */
  document.addEventListener('submit', ev => {
    if (ev.target.id === 'wlForm') { ev.preventDefault(); submitWhitelist(ev.target); }
  });

  /* --- Teclado: filas navegables y atajo de foco ------------------------- */
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const row = ev.target.closest && ev.target.closest('tr[data-goto]');
      if (row) { ev.preventDefault(); go(row.dataset.goto); }
    }
  });

  /* --- Botón global de exportación --------------------------------------- */
  $('#btnExport').addEventListener('click', () =>
    toast('ok', 'Informe en preparación', 'El MVP exporta el corte actual de la vista activa.'));

  /* --- Arranque ---------------------------------------------------------- */
  window.addEventListener('hashchange', render);
  syncRole();
  if (!location.hash) location.hash = '#/dashboard';
  render();
})();
