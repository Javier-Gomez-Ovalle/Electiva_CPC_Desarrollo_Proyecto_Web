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
    authenticated: true,
    role: 'coordinador',
    loginFormRole: 'coordinador',
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
    $$('.seg__btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.role === state.role)));
    if (D.API) D.API.setRole(state.role);
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

    if (root === 'login' || !state.authenticated) {
      if (shell) shell.classList.add('shell--login');
      view.innerHTML = V.loginView(state);
      view.scrollTop = 0;
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
  function submitLogin(form) {
    const picked = form.login_role ? form.login_role.value : state.loginFormRole;
    const roleKey = D.ROLES[picked] ? picked : 'coordinador';
    const pass = form.password ? form.password.value : '';
    if (!pass || pass.length < 4) {
      setFieldError('eLoginPass', 'Ingresa tu contraseña institucional.');
      return;
    }
    setFieldError('eLoginPass', '');

    state.role = roleKey;
    state.loginFormRole = roleKey;
    state.authenticated = true;
    syncRole();

    if (D.API) {
      D.API.login(roleKey, pass).catch(() => {});
    }

    const r = D.ROLES[roleKey];
    toast('ok', 'Sesión iniciada · ' + r.label,
      'Bienvenido(a), ' + r.name + ' (' + (r.institution || 'Clínica Central') + ').');
    go('#/dashboard');
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
        if (D.API) {
          D.API.exportIncident(incId).catch(() => {});
        }
        toast('ok', 'Exportación preparada', 'STIX 2.1 + JSON. En el MVP se descarga desde el endpoint de reporting.');
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
        state.authenticated = false;
        if (D.API) D.API.logout().catch(() => {});
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
    if (t.name === 'login_role') {
      state.loginFormRole = t.value;
      const r = D.ROLES[t.value];
      const lUser = document.getElementById('lUser');
      if (r && lUser) lUser.value = r.mail;
      $$('#loginRolePicker .role-option').forEach(opt => {
        if (opt.dataset.roleOption === t.value) opt.classList.add('role-option--active');
        else opt.classList.remove('role-option--active');
      });
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
    if (ev.target.id === 'loginForm') { ev.preventDefault(); submitLogin(ev.target); }
    if (ev.target.id === 'profileForm') { ev.preventDefault(); submitProfile(ev.target); }
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const row = ev.target.closest && ev.target.closest('tr[data-goto]');
      if (row) { ev.preventDefault(); go(row.dataset.goto); }
    }
  });

  $('#btnExport').addEventListener('click', () => {
    if (D.API) D.API.exportIncident('INC-2026-0417').catch(() => {});
    toast('ok', 'Informe en preparación', 'El MVP exporta el corte actual de la vista activa.');
  });

  /* --- Arranque ---------------------------------------------------------- */
  window.addEventListener('hashchange', render);
  syncRole();
  syncFromBackend();
  if (!location.hash) location.hash = '#/dashboard';
  render();
})();
