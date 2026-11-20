/* =========================================================================
   HeraUEBA · frontend/assets/app.js
   Estado, enrutado por hash y orquestación con el backend FastAPI (/api/v1).
   ========================================================================= */
(function () {
  'use strict';

  const D = window.HERA, U = window.UI, V = window.VIEWS, M = window.MODALS;
  const esc = U.esc, icon = D.icon;

  /* --- Estado ------------------------------------------------------------ */
  const state = {
    authenticated: false,
    role: 'coordinador',
    window: 24,
    windowAlertsCount: D.ALERTS.length,
    risk: 'all',
    unit: 'all',
    country: 'all',
    onlyCritical: false,
    history: { user: 'mg.ramirez', window: '24h', type: 'all', result: 'all' },
    isolation: { step: 1, target: 'mg.ramirez', reason: '', reauth: '', notify: false, evidence: false, confirm: '', errors: {} },
    critTarget: 'enf.castillo',
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
    const pool = D.EXTENDED_ALERTS || D.ALERTS;
    const byWindow = pool.filter(a => {
      const age = typeof a.ageHours === 'number' ? a.ageHours : 2;
      return age <= state.window;
    });
    state.windowAlertsCount = byWindow.length;

    state.visibleAlerts = byWindow.filter(a => {
      if (state.onlyCritical && a.sev !== 'critico') return false;
      if (state.risk === 'alta' && a.risk < 0.85) return false;
      if (state.risk === 'media' && (a.risk < 0.5 || a.risk >= 0.85)) return false;
      if (state.risk === 'baja' && a.risk >= 0.5) return false;
      const u = D.USERS[a.user] || { dept: '' };
      if (state.unit !== 'all' && u.dept !== state.unit && a.user !== state.unit) return false;
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
    const pool = D.EXTENDED_ALERTS || D.ALERTS;
    const n = pool.filter(a => (typeof a.ageHours === 'number' ? a.ageHours <= state.window : true) && a.sev === 'critico' && !state.isolated[a.user]).length;
    const bc = $('#navCriticalCount');
    if (bc) {
      bc.textContent = n;
      bc.style.display = n ? '' : 'none';
    }
  }

  function syncRole() {
    const r = D.ROLES[state.role] || D.ROLES.coordinador;
    $('#roleName').textContent = r.name;
    $('#roleLabel').textContent = r.label;
    const av = $('#roleAvatar');
    if (av) {
      if (r.avatarUrl) {
        av.innerHTML = '<img src="' + esc(r.avatarUrl) + '" alt="Foto de perfil de ' + esc(r.name) + '" />';
      } else {
        av.textContent = r.initials;
      }
    }
  }

  /* --- Sincronización asíncrona con el Backend /api/v1 ------------------- */
  function syncFromBackend() {
    if (!D.API) return;
    D.API.getAlerts({ window_hours: state.window }).then(data => {
      if (data && Array.isArray(data.alerts) && data.alerts.length) {
        data.alerts.forEach(a => {
          if (a.is_isolated) state.isolated[a.user] = true;
        });
      }
    }).catch(() => {});

    D.API.getWhitelist().then(data => {
      if (data && Array.isArray(data.entries) && data.entries.length) {
        state.wl = data.entries;
        const { parts } = parseHash();
        if (parts[0] === 'whitelist' && !document.getElementById('modalRoot').innerHTML) {
          const fCidr = document.getElementById('fCidr');
          if (!fCidr || !fCidr.value) {
            $('#view').innerHTML = V.whitelist(state, chrome);
          }
        }
      }
    }).catch(() => {});
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

    if (document.getElementById('modalRoot').innerHTML) M.close();

    const { parts, q } = parseHash();
    const root = parts[0] || (state.authenticated ? 'dashboard' : 'login');
    const view = $('#view');
    const shell = $('#appShell');

    if (state.authenticated && root === 'login') {
      go('#/dashboard');
      return;
    }

    if (!state.authenticated) {
      if (shell) shell.classList.add('shell--login');
      view.innerHTML = V.loginView(state);
      view.scrollTop = 0;
      initTerminal();
      return;
    }

    if (shell) shell.classList.remove('shell--login');

    switch (root) {
      case 'alerta': {
        const incId = parts[1] || 'INC-2026-0417';
        view.innerHTML = V.alertDetail(incId, state, chrome);
        if (D.API && incId) {
          D.API.getDecisionPath(incId).then(tree => {
            if (tree && Array.isArray(tree.nodes) && tree.nodes.length) {
              D.TREES[incId] = {
                nodes: tree.nodes,
                verdict: tree.verdict,
                factor: tree.factor,
                incidence: tree.incidence,
                globalRule: tree.globalRule || tree.global_rule,
                branch: tree.branch,
                reading: tree.reading
              };
            }
          }).catch(() => {});
        }
        break;
      }
      case 'whitelist':
        view.innerHTML = V.whitelist(state, chrome);
        break;
      case 'historial':
        if (q.u && D.USERS[q.u]) state.history.user = q.u;
        view.innerHTML = V.history(state, chrome);
        if (D.API) {
          D.API.getUserForensics(state.history.user, state.history.window).then(f => {
            if (f && f.user && f.user.is_isolated) {
              state.isolated[state.history.user] = true;
            }
          }).catch(() => {});
        }
        break;
      case 'aislamiento':
        if (q.u && D.USERS[q.u] && D.CRITICAL_UNITS.indexOf(D.USERS[q.u].unit) === -1) {
          state.isolation.target = q.u;
        }
        view.innerHTML = V.isolationView(state, chrome);
        break;
      case 'error-unidad-critica':
        if (q.u && D.USERS[q.u] && D.CRITICAL_UNITS.indexOf(D.USERS[q.u].unit) !== -1) {
          state.critTarget = q.u;
        }
        view.innerHTML = V.criticalUnitView(state, chrome);
        break;
      case 'trazabilidad':
        view.innerHTML = V.traceabilityView(state, chrome);
        break;
      case 'perfil':
        view.innerHTML = V.profileView(state, chrome);
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
       no un permiso, y aplica a todos los roles por igual. */
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

  function isIsolationFullView() {
    const { parts } = parseHash();
    return parts[0] === 'aislamiento' && !document.getElementById('modalRoot').innerHTML;
  }

  function renderIsolationStep2() {
    if (isIsolationFullView()) {
      render();
    } else {
      M.isolationStep2(state, state.isolation.target);
    }
  }

  function renderIsolationStep1Preserving() {
    if (isIsolationFullView()) {
      render();
    } else {
      M.isolationStep1(state, state.isolation.target);
    }
  }

  function executeIsolation() {
    const id = state.isolation.target;
    const f = state.isolation;
    state.isolated[id] = true;
    M.close();

    if (D.API && D.ROLES[state.role] && D.ROLES[state.role].canIsolate) {
      const pool = D.EXTENDED_ALERTS || D.ALERTS;
      D.API.isolateAccount({
        username: id,
        alert_id: (pool.find(a => a.user === id) || { id: 'INC-2026-0417' }).id,
        reason: f.reason,
        reauth_password: f.reauth,
        confirmation_word: f.confirm.trim().toUpperCase(),
        two_step_confirmed: true,
        notify_clinical: Boolean(f.notify),
        attach_evidence: Boolean(f.evidence)
      }).catch(() => {});
    }

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
      if (err) err.hidden = true;
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

    const entry = {
      cidr: cidr, country: country, cc: country.slice(0, 3).toUpperCase(),
      scope: form.scope.value, note: note, until: until,
      by: D.ROLES[state.role].name, state: 'activa'
    };
    state.wl.unshift(entry);

    if (D.API && D.ROLES[state.role] && D.ROLES[state.role].canIsolate) {
      D.API.createWhitelist({
        cidr: cidr,
        country: country,
        scope: form.scope.value,
        end_date: until,
        reason: note,
        audit_confirmed: true
      }).catch(() => {});
    }

    toast('ok', 'Entrada agregada a la whitelist', cidr + ' · ' + country + ' · vigente hasta ' + until);
    render();
  }

  function deleteWhitelist(cidr) {
    const before = state.wl.length;
    state.wl = state.wl.filter(w => w.cidr !== cidr);
    if (D.API && D.ROLES[state.role] && D.ROLES[state.role].canIsolate) {
      D.API.deleteWhitelist(cidr, 'delete').catch(() => {});
    }
    toast('ok', 'Entrada eliminada', before !== state.wl.length
      ? cidr + ' ya no se aplica. El registro de auditoría se conserva.'
      : 'No se encontró la entrada.');
    render();
  }

  /* --- Inicio de sesión y configuración de cuenta ------------------------ */
  /* --- Sesión autenticada ------------------------------------------------ */
  function applySession(user) {
    const key = user && user.role_key;
    const r = key && D.ROLES[key];
    if (!r) return false;
    r.name = user.full_name || r.name;
    r.initials = user.initials || r.initials;
    r.mail = user.email || r.mail;
    r.institution = user.institution || r.institution;
    r.phone = user.phone || r.phone;
    if (user.avatar_url) r.avatarUrl = user.avatar_url;
    state.role = key;
    state.authenticated = true;
    syncRole();
    return true;
  }

  /* --- Terminal SSH de inicio de sesión ---------------------------------- */
  const HOST = 'soc-bog-01';
  const term = { stage: 'user', username: '', attempts: 0, busy: false };

  function termPrint(text, cls) {
    const scr = $('#termScreen');
    if (!scr) return;
    const row = document.createElement('div');
    row.className = 'term__row' + (cls ? ' term__row--' + cls : '');
    row.textContent = text;
    scr.appendChild(row);
    scr.scrollTop = scr.scrollHeight;
  }

  function termPrompt(stage) {
    term.stage = stage;
    const label = $('#termPrompt'), input = $('#termInput');
    if (!label || !input) return;
    if (stage === 'pass') {
      label.textContent = term.username + '@' + HOST + "'s password:";
      input.type = 'password';
      input.autocomplete = 'current-password';
    } else {
      label.textContent = 'login as:';
      input.type = 'text';
      input.autocomplete = 'off';
    }
    input.value = '';
    input.disabled = false;
    input.focus();
  }

  function initTerminal() {
    term.stage = 'user'; term.username = ''; term.attempts = 0; term.busy = false;
    termPrint('HeraUEBA · Consola SOC Salud · Nodo ' + HOST + ' (TLS 1.3)', 'info');
    termPrint('Acceso restringido a personal autorizado. Toda actividad queda auditada', 'dim');
    termPrint('(Ley 1581 de 2012 · HIPAA Security Rule · BR-001 / BR-002).', 'dim');
    termPrint('');
    termPrompt('user');
    const screen = $('#term');
    if (screen) screen.addEventListener('click', () => { const i = $('#termInput'); if (i && !i.disabled) i.focus(); });
  }

  function termFail(message) {
    term.attempts += 1;
    termPrint(message, 'err');
    if (term.attempts >= 3) {
      termPrint('Too many authentication failures. Connection to ' + HOST + ' closed.', 'err');
      const input = $('#termInput');
      if (input) input.disabled = true;
      setTimeout(() => { if (!state.authenticated) render(); }, 1800);
      return;
    }
    termPrompt('pass');
  }

  function submitTerminal(form) {
    if (term.busy) return;
    const input = form.term_input;
    const value = input.value;

    if (term.stage === 'user') {
      const user = value.trim();
      if (!user) return;
      term.username = user;
      termPrint('login as: ' + user);
      termPrompt('pass');
      return;
    }

    termPrint(term.username + '@' + HOST + "'s password:");
    if (!value) { termFail('Permission denied, please try again.'); return; }
    term.busy = true;
    input.disabled = true;
    input.value = '';
    termPrint('Autenticando…', 'dim');

    D.API.login(term.username, value).then(data => {
      if (!data || !data.user) throw new Error('Sin respuesta del servidor.');
      if (!applySession(data.user)) throw new Error('Perfil no reconocido.');
      term.busy = false;
      termPrint('Access granted.', 'ok');
      termPrint('Bienvenido(a), ' + data.user.full_name + ' · ' + data.user.role_name, 'ok');
      syncFromBackend();
      setTimeout(() => go('#/dashboard'), 700);
    }).catch(err => {
      term.busy = false;
      if (err && err.status === 429) {
        termPrint(err.message, 'err');
        termPrint('Connection to ' + HOST + ' closed.', 'err');
        setTimeout(() => { if (!state.authenticated) render(); }, 1800);
      } else if (err && err.status) {
        termFail('Permission denied, please try again.');
      } else {
        termPrint('ssh: connect to host ' + HOST + ': no se pudo contactar con el servidor.', 'err');
        termPrompt('pass');
      }
    });
  }

  function submitProfile(form) {
    const name = form.full_name.value.trim();
    const inst = form.institution.value.trim();
    const mail = form.email.value.trim();
    const phone = form.phone.value.trim();
    const shiftField = form.shift_schedule || form.shift;
    const shift = shiftField ? shiftField.value.trim() : '';
    const avatarUrl = form.avatar_url ? form.avatar_url.value.trim() : '';

    if (name.length < 3) {
      toast('warn', 'Nombre incompleto', 'Ingresa tu nombre completo (mínimo 3 caracteres).');
      return;
    }
    if (inst.length < 2) {
      toast('warn', 'Institución requerida', 'Indica la institución o empresa.');
      return;
    }

    const r = D.ROLES[state.role];
    r.name = name;
    r.institution = inst;
    r.mail = mail;
    r.phone = phone;
    r.shift = shift || r.shift;
    r.avatarUrl = avatarUrl;
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      r.initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (words.length === 1) {
      r.initials = words[0].slice(0, 2).toUpperCase();
    }

    syncRole();

    if (D.API) {
      D.API.updateProfile({
        full_name: name,
        institution: inst,
        email: mail,
        phone: phone,
        shift_schedule: r.shift,
        avatar_url: avatarUrl || null
      }).catch(() => {});
    }

    toast('ok', 'Perfil actualizado', name + ' · ' + inst + ' (' + mail + ')');
    render();
  }

  /* --- Delegación de eventos --------------------------------------------- */
  document.addEventListener('click', ev => {
    const t = ev.target;

    const expItem = t.closest('[data-export-format]');
    if (expItem) {
      ev.preventDefault();
      ev.stopPropagation();
      const fmt = expItem.dataset.exportFormat;
      const scope = expItem.dataset.exportScope || '';
      const id = expItem.dataset.exportId || '';
      closeExportMenus();
      runExport(fmt, scope, id);
      return;
    }

    const expToggle = t.closest('[data-action="toggle-export-menu"]');
    if (expToggle) {
      ev.preventDefault();
      ev.stopPropagation();
      const wrap = expToggle.closest('.export-dropdown');
      if (wrap) {
        const willOpen = !wrap.classList.contains('is-open');
        closeExportMenus();
        if (willOpen) {
          wrap.classList.add('is-open');
          expToggle.setAttribute('aria-expanded', 'true');
        }
      }
      return;
    }

    if (!t.closest('.export-dropdown')) {
      closeExportMenus();
    }

    const row = t.closest('tr[data-goto]');
    if (row && !t.closest('a,button')) { go(row.dataset.goto); return; }

    if (t.closest('[data-close]')) {
      const goto = t.closest('[data-goto-after]');
      M.close();
      if (goto) go(goto.dataset.gotoAfter);
      return;
    }
    if (t.closest('[data-close-scrim]') && t === t.closest('[data-close-scrim]')) { M.close(); return; }

    const chip = t.closest('[data-window]');
    if (chip) {
      state.window = Number(chip.dataset.window);
      syncFromBackend();
      render();
      toast('info', 'Ventana temporal actualizada', 'Consultando telemetría de las últimas ' + (state.window === 1 ? '1 h' : state.window === 24 ? '24 h' : state.window === 168 ? '7 días' : '30 días') + '.');
      return;
    }

    const hwin = t.closest('[data-hwin]');
    if (hwin) {
      state.history.window = hwin.dataset.hwin;
      render();
      toast('info', 'Ventana forense actualizada', 'Mostrando eventos para: ' + hwin.textContent.trim());
      return;
    }

    const isoTarget = t.closest('[data-iso-target]');
    if (isoTarget) {
      state.isolation = {
        step: 1,
        target: isoTarget.dataset.isoTarget,
        reason: '',
        reauth: '',
        notify: false,
        evidence: false,
        confirm: '',
        errors: {}
      };
      render();
      return;
    }

    const critTarget = t.closest('[data-crit-target]');
    if (critTarget) {
      state.critTarget = critTarget.dataset.critTarget;
      state.criticalTarget = critTarget.dataset.critTarget;
      render();
      return;
    }

    const uchip = t.closest('[data-user]');
    if (uchip && uchip.classList.contains('chip')) {
      state.history.user = uchip.dataset.user;
      go('#/historial?u=' + encodeURIComponent(state.history.user));
      return;
    }

    const ctree = t.closest('[data-copy-tree]');
    if (ctree) {
      const pool = D.EXTENDED_ALERTS || D.ALERTS;
      const a = pool.find(x => x.id === ctree.dataset.copyTree) || D.ALERTS[0];
      copyText(U.treeAsText(a), 'Ruta de decisión de ' + a.id);
      return;
    }
    const cinc = t.closest('[data-copy-inc]');
    if (cinc) {
      const pool = D.EXTENDED_ALERTS || D.ALERTS;
      const a = pool.find(x => x.id === cinc.dataset.copyInc) || D.ALERTS[0];
      copyText(a.id + '\n' + a.rule + '\nscore ' + a.risk.toFixed(2) + '\n' + U.treeAsText(a), 'Incidente ' + a.id);
      return;
    }

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
        renderIsolationStep1Preserving();
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

      case 'export': {
        const { parts } = parseHash();
        const incId = parts[1] || 'INC-2026-0417';
        runExport('json', 'alerta', incId);
        break;
      }

      case 'wl-toggle': {
        const w = state.wl.find(x => x.cidr === act.dataset.cidr);
        if (w) {
          w.state = w.state === 'activa' ? 'expirada' : 'activa';
          if (D.API && D.ROLES[state.role] && D.ROLES[state.role].canIsolate) {
            D.API.deleteWhitelist(w.cidr, 'toggle').catch(() => {});
          }
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

      case 'logout':
        if (D.API) D.API.logout().catch(() => {});
        state.authenticated = false;
        toast('info', 'Sesión cerrada', 'Se ha cerrado la sesión del operador de forma segura.');
        go('#/login');
        break;

      default:
        break;
    }
  });

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
      if (t.dataset.h === 'window') {
        const selText = t.options && t.selectedIndex >= 0 ? t.options[t.selectedIndex].text : t.value;
        toast('info', 'Filtro temporal actualizado', 'Mostrando eventos para: ' + selText);
      }
      return;
    }
    if (t.id === 'pAvatarFile' && t.files && t.files[0]) {
      const file = t.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const dataUrl = e.target.result;
        const urlInput = document.getElementById('pAvatarUrl');
        if (urlInput) urlInput.value = dataUrl;
        const preview = document.getElementById('profileAvatarPreview');
        if (preview) {
          preview.innerHTML = '<img src="' + esc(dataUrl) + '" alt="Vista previa de imagen de perfil" />';
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    if (t.id === 'wlForm') return;

    if (t.id === 'mNotify') state.isolation.notify = t.checked;
    if (t.id === 'mEvidence') state.isolation.evidence = t.checked;
  });

  document.addEventListener('input', ev => {
    const t = ev.target;
    if (t.id === 'mReason') { state.isolation.reason = t.value; clearErr('mReasonErr', t); }
    if (t.id === 'mReauth') { state.isolation.reauth = t.value; clearErr('mReauthErr', t); }
    if (t.id === 'mConfirm') {
      state.isolation.confirm = t.value;
      const box = document.querySelector('.modal') || document.getElementById('view');
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
    if (t.id === 'pAvatarUrl') {
      const preview = document.getElementById('profileAvatarPreview');
      const r = D.ROLES[state.role] || D.ROLES.coordinador;
      if (preview) {
        if (t.value.trim()) {
          preview.innerHTML = '<img src="' + esc(t.value.trim()) + '" alt="Vista previa de imagen de perfil" />';
        } else {
          preview.textContent = r.initials;
        }
      }
    }
    if (t.id === 'fCidr') clearErr('eCidr', t);
    if (t.id === 'fCountry') clearErr('eCountry', t);
    if (t.id === 'fNote') clearErr('eNote', t);
  });

  function clearErr(errId, input) {
    const e = document.getElementById(errId);
    if (e && !e.hidden) { e.hidden = true; input.removeAttribute('aria-invalid'); }
  }

  document.addEventListener('submit', ev => {
    if (ev.target.id === 'wlForm') { ev.preventDefault(); submitWhitelist(ev.target); }
    if (ev.target.id === 'termForm') { ev.preventDefault(); submitTerminal(ev.target); }
    if (ev.target.id === 'profileForm') { ev.preventDefault(); submitProfile(ev.target); }
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const row = ev.target.closest && ev.target.closest('tr[data-goto]');
      if (row) { ev.preventDefault(); go(row.dataset.goto); }
    }
  });

  /* --- Motor de exportación real (CSV, JSON, XLSX) ----------------------- */
  const CRC32_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC32_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeZipStore(entries) {
    const enc = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    entries.forEach(entry => {
      const nameBytes = enc.encode(entry.name);
      const dataBytes = typeof entry.data === 'string' ? enc.encode(entry.data) : entry.data;
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x5421, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);

      localParts.push(lh, dataBytes);

      const ch = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x5421, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      ch.set(nameBytes, 46);

      centralParts.push(ch);
      offset += lh.length + size;
    });

    const centralSize = centralParts.reduce((a, b) => a + b.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob(localParts.concat(centralParts, [eocd]), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  function xmlEsc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function colLetter(idx) {
    let s = '';
    let n = idx + 1;
    while (n > 0) {
      const m = (n - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function buildXlsxBlob(sheetTitle, headers, rows) {
    const allRows = [headers].concat(rows);
    const rowXml = allRows.map((r, rIdx) => {
      const cells = r.map((val, cIdx) => {
        const ref = colLetter(cIdx) + (rIdx + 1);
        if (typeof val === 'number' && isFinite(val)) {
          return '<c r="' + ref + '"><v>' + val + '</v></c>';
        }
        return '<c r="' + ref + '" t="inlineStr"><is><t>' + xmlEsc(val) + '</t></is></c>';
      }).join('');
      return '<row r="' + (rIdx + 1) + '">' + cells + '</row>';
    }).join('');

    const safeSheet = xmlEsc((sheetTitle || 'Reporte SOC').slice(0, 31));
    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
      + '</Types>';

    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
      + '</Relationships>';

    const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
      + '</Relationships>';

    const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
      + '<sheets><sheet name="' + safeSheet + '" sheetId="1" r:id="rId1"/></sheets>'
      + '</workbook>';

    const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<sheetData>' + rowXml + '</sheetData>'
      + '</worksheet>';

    return makeZipStore([
      { name: '[Content_Types].xml', data: contentTypes },
      { name: '_rels/.rels', data: rels },
      { name: 'xl/_rels/workbook.xml.rels', data: wbRels },
      { name: 'xl/workbook.xml', data: workbook },
      { name: 'xl/worksheets/sheet1.xml', data: sheet }
    ]);
  }

  function buildCsvBlob(headers, rows) {
    const escCsv = val => {
      const s = String(val == null ? '' : val);
      if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers.map(escCsv).join(',')].concat(
      rows.map(r => r.map(escCsv).join(','))
    );
    return new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function buildExportPayload(scopeOverride, idOverride) {
    const { parts } = parseHash();
    const root = scopeOverride || parts[0] || 'dashboard';
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const operator = (D.ROLES[state.role] && D.ROLES[state.role].name) || state.role;

    if (root === 'alerta') {
      const incId = idOverride || parts[1] || 'INC-2026-0417';
      const pool = D.EXTENDED_ALERTS || D.ALERTS;
      const a = pool.find(x => x.id === incId) || D.ALERTS[0];
      const u = D.USERS[a.user] || { full: a.user, unit: 'General', job: 'Personal Clínico' };
      const t = D.TREES[a.id] || D.TREES['INC-2026-0417'];
      const headers = ['Incidente', 'Fecha_COT', 'Severidad', 'Riesgo', 'Usuario', 'Titular', 'Unidad', 'Unidad_Critica_BR002', 'IP_Origen', 'Pais', 'ASN', 'Nodo', 'Condicion_Split', 'Valor_Observado', 'Resultado_Nodo', 'Veredicto_Modelo'];
      const nodes = (t && t.nodes) ? t.nodes : [];
      const isCrit = D.CRITICAL_UNITS.indexOf(u.unit) !== -1 ? 'SI (Protegida BR-002)' : 'NO';
      const rows = nodes.map(n => [
        a.id, a.at, a.sev.toUpperCase(), Number(a.risk), a.user, u.full, u.unit, isCrit,
        a.ip, a.country, a.asn, 'N' + (n.i || n.node_index), n.rule || n.split_condition,
        n.obs || n.observed_value, n.v || n.node_outcome, t.verdict
      ]);
      const jsonObj = {
        type: 'bundle',
        id: 'bundle--heraueba-' + a.id.toLowerCase(),
        spec_version: '2.1',
        exported_at: new Date().toISOString(),
        exported_by: operator,
        normative_compliance: ['Ley 1581 de 2012 (Colombia)', 'HIPAA Security Rule §164.312(b)', 'BR-001', 'BR-002'],
        incident: {
          id: a.id, title: a.title, severity: a.sev, risk_score: a.risk, status: a.status,
          detected_at: a.at, source_ip: a.ip, country: a.country, asn: a.asn,
          subject: { username: a.user, full_name: u.full, unit: u.unit, job_title: u.job, is_critical_unit: D.CRITICAL_UNITS.indexOf(u.unit) !== -1 }
        },
        decision_tree: t
      };
      return {
        baseName: 'heraueba-incidente-' + a.id.toLowerCase() + '-' + stamp,
        sheetTitle: a.id,
        label: 'Incidente ' + a.id,
        incId: a.id,
        headers: headers,
        rows: rows,
        json: jsonObj
      };
    }

    if (root === 'whitelist') {
      const headers = ['CIDR', 'Pais', 'Codigo', 'Alcance', 'Justificacion', 'Vigencia', 'Registrado_Por', 'Estado'];
      const rows = state.wl.map(w => [w.cidr, w.country, w.cc, w.scope, w.note, w.until, w.by, w.state]);
      return {
        baseName: 'heraueba-whitelist-' + stamp,
        sheetTitle: 'Whitelist Geografica',
        label: 'Whitelist geográfica (' + rows.length + ' rangos)',
        headers: headers,
        rows: rows,
        json: { exported_at: new Date().toISOString(), exported_by: operator, view: 'whitelist', total: rows.length, entries: state.wl }
      };
    }

    if (root === 'historial') {
      const uid = state.history.user || 'mg.ramirez';
      const u = D.USERS[uid] || { full: uid, unit: 'General', job: 'Personal Clínico' };
      const evs = D.eventsFor('INC-2026-0417', state.history);
      const headers = ['Usuario', 'Titular', 'Unidad', 'Tiempo', 'Tipo', 'Veredicto', 'Evento', 'Detalle'];
      const rows = evs.map(e => [uid, u.full, u.unit, e.t, e.type, e.verdict, e.title, e.meta]);
      return {
        baseName: 'heraueba-historial-' + uid + '-' + stamp,
        sheetTitle: 'Historial ' + uid,
        label: 'Historial forense de ' + uid,
        headers: headers,
        rows: rows,
        json: { exported_at: new Date().toISOString(), exported_by: operator, view: 'historial', user: u, window: state.history.window, events: evs }
      };
    }

    if (root === 'trazabilidad') {
      const headers = ['Codigo', 'Categoria', 'Descripcion', 'Normativa', 'Estado'];
      const rows = [
        ['FR-001', 'Funcional', 'Visualización priorizada de Alertas Rojas', 'US-001', 'CUBIERTO'],
        ['FR-002', 'Funcional', 'Filtro temporal por defecto (24 horas)', 'US-002', 'CUBIERTO'],
        ['FR-003', 'Funcional', 'Filtro histórico por usuario (180 días)', 'US-003', 'CUBIERTO'],
        ['FR-004', 'Funcional', 'Explicabilidad del modelo (Caja Blanca N1-N5)', 'US-004', 'CUBIERTO'],
        ['FR-005', 'Funcional', 'Interfaz de aislamiento simulado', 'US-005', 'CUBIERTO'],
        ['FR-006', 'Funcional', 'Verificación de dos pasos para aislamiento', 'US-005', 'CUBIERTO'],
        ['FR-007', 'Funcional', 'Restricción de bloqueo por unidad crítica', 'US-005', 'CUBIERTO'],
        ['FR-008', 'Funcional', 'Gestión de Whitelist geográfica (CRUD)', 'US-006', 'CUBIERTO'],
        ['BR-001', 'Regla de Negocio', 'Cero tolerancia a bloqueos automáticos (umbral 0.98)', 'Ley 1581 / HIPAA', 'CUBIERTO'],
        ['BR-002', 'Regla de Negocio', 'Exención estricta de unidades críticas (UCI, Quirófano, Urgencias)', 'Continuidad Clínica', 'CUBIERTO']
      ];
      return {
        baseName: 'heraueba-trazabilidad-' + stamp,
        sheetTitle: 'Trazabilidad SRS',
        label: 'Matriz de trazabilidad normativa',
        headers: headers,
        rows: rows,
        json: { exported_at: new Date().toISOString(), exported_by: operator, view: 'trazabilidad', requirements: rows }
      };
    }

    /* Por defecto: Dashboard / corte actual de alertas */
    const list = state.visibleAlerts && state.visibleAlerts.length ? state.visibleAlerts : D.ALERTS;
    const headers = ['ID_Incidente', 'Fecha_COT', 'Severidad', 'Puntaje_Riesgo', 'Usuario', 'Titular', 'Unidad', 'Unidad_Critica_BR002', 'IP_Origen', 'Pais', 'ASN', 'Regla_Disparada', 'Estado'];
    const rows = list.map(a => {
      const u = D.USERS[a.user] || { full: a.user, unit: 'General' };
      const crit = D.CRITICAL_UNITS.indexOf(u.unit) !== -1 ? 'SI' : 'NO';
      return [a.id, a.at, a.sev.toUpperCase(), Number(a.risk), a.user, u.full, u.unit, crit, a.ip, a.country, a.asn, a.ruleShort || a.rule, state.isolated[a.user] ? 'Aislada' : a.status];
    });
    return {
      baseName: 'heraueba-alertas-' + stamp,
      sheetTitle: 'Alertas SOC',
      label: 'Corte de alertas (' + rows.length + ' incidentes)',
      headers: headers,
      rows: rows,
      json: {
        exported_at: new Date().toISOString(),
        exported_by: operator,
        view: 'dashboard',
        window_hours: state.window,
        total_alerts: rows.length,
        alerts: list
      }
    };
  }

  function closeExportMenus() {
    $$('.export-dropdown.is-open').forEach(d => {
      d.classList.remove('is-open');
      const b = d.querySelector('button[aria-expanded]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }

  function runExport(format, scopeOverride, idOverride) {
    const fmt = (format || 'json').toLowerCase();
    const payload = buildExportPayload(scopeOverride, idOverride);
    const targetInc = payload.incId || 'INC-2026-0417';

    if (fmt === 'csv') {
      const blob = buildCsvBlob(payload.headers, payload.rows);
      triggerDownload(blob, payload.baseName + '.csv');
      if (D.API) D.API.exportIncident(targetInc).catch(() => {});
      toast('ok', 'CSV descargado (' + fmt.toUpperCase() + ')', payload.label + ' → ' + payload.baseName + '.csv');
      return;
    }

    if (fmt === 'xlsx') {
      const blob = buildXlsxBlob(payload.sheetTitle, payload.headers, payload.rows);
      triggerDownload(blob, payload.baseName + '.xlsx');
      if (D.API) D.API.exportIncident(targetInc).catch(() => {});
      toast('ok', 'Excel descargado (' + fmt.toUpperCase() + ')', payload.label + ' → ' + payload.baseName + '.xlsx');
      return;
    }

    /* JSON: si es detalle de alerta intenta enriquecer con el paquete STIX del backend */
    if ((scopeOverride === 'alerta' || parseHash().parts[0] === 'alerta') && D.API) {
      D.API.exportIncident(targetInc).then(stix => {
        const data = stix || payload.json;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        triggerDownload(blob, payload.baseName + '.json');
        toast('ok', 'JSON / STIX 2.1 descargado', payload.label + ' → ' + payload.baseName + '.json');
      }).catch(() => {
        const blob = new Blob([JSON.stringify(payload.json, null, 2)], { type: 'application/json;charset=utf-8' });
        triggerDownload(blob, payload.baseName + '.json');
        toast('ok', 'JSON descargado', payload.label + ' → ' + payload.baseName + '.json');
      });
      return;
    }

    if (D.API) D.API.exportIncident(targetInc).catch(() => {});
    const blob = new Blob([JSON.stringify(payload.json, null, 2)], { type: 'application/json;charset=utf-8' });
    triggerDownload(blob, payload.baseName + '.json');
    toast('ok', 'JSON descargado', payload.label + ' → ' + payload.baseName + '.json');
  }

  $('#btnExport').addEventListener('click', ev => {
    ev.stopPropagation();
    const wrap = $('#topExportWrap');
    if (!wrap) return;
    const willOpen = !wrap.classList.contains('is-open');
    closeExportMenus();
    if (willOpen) {
      wrap.classList.add('is-open');
      $('#btnExport').setAttribute('aria-expanded', 'true');
    }
  });

  /* --- Arranque ---------------------------------------------------------- */
  window.addEventListener('hashchange', render);
  window.addEventListener('hera:unauthorized', () => {
    if (!state.authenticated) return;
    state.authenticated = false;
    toast('warn', 'Sesión expirada', 'Vuelve a iniciar sesión para continuar.');
    go('#/login');
  });

  if (D.API && D.API.hasSession()) {
    /* Restaura una sesión previa solo si el servidor valida el token. */
    D.API.getMe().then(user => {
      if (user && applySession(user)) syncFromBackend();
    }).catch(() => {}).then(() => {
      if (state.authenticated && (!location.hash || location.hash === '#/login')) location.hash = '#/dashboard';
      render();
    });
  } else {
    render();
  }
})();
