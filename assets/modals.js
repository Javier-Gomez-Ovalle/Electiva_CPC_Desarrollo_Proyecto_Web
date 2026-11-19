/* =========================================================================
   HeraUEBA · modals.js
   Modal de verificación de dos pasos (aislamiento) y modal de estado
   normativo BR-002 (unidad crítica). Fricción segura: ninguna acción
   destructiva se ejecuta en un clic.
   ========================================================================= */
window.MODALS = (function () {
  'use strict';

  const D = window.HERA, U = window.UI;
  const esc = U.esc, icon = D.icon;

  let lastFocus = null;

  /* --- Andamiaje --------------------------------------------------------- */
  function open(html, opts) {
    const o = opts || {};
    lastFocus = document.activeElement;
    const root = document.getElementById('modalRoot');
    root.innerHTML =
      '<div class="scrim" data-close-scrim="1">'
      + '<div class="modal' + (o.wide ? ' modal--wide' : '') + '" role="dialog" aria-modal="true"'
      + ' aria-labelledby="mdTitle" aria-describedby="' + (o.describedBy || 'mdLede') + '">'
      + html + '</div></div>';
    const box = root.querySelector('.modal');
    box.addEventListener('keydown', trap);
    const first = box.querySelector('[autofocus]') || box.querySelector('input,textarea,button');
    if (first) first.focus();
    document.addEventListener('keydown', escClose);
    return box;
  }

  function close() {
    document.getElementById('modalRoot').innerHTML = '';
    document.removeEventListener('keydown', escClose);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  function escClose(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }

  function trap(e) {
    if (e.key !== 'Tab') return;
    const box = e.currentTarget;
    const f = box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* --- Indicador de pasos ------------------------------------------------ */
  function stepper(step) {
    const mk = (n, label, st) =>
      '<span class="steps__item" data-state="' + st + '"><span class="steps__num">'
      + (st === 'done' ? '✓' : n) + '</span>' + label + '</span>';
    return '<div class="steps">'
      + mk(1, 'Justificación', step > 1 ? 'done' : 'active')
      + '<span class="steps__rule" aria-hidden="true"></span>'
      + mk(2, 'Confirmación', step > 1 ? 'active' : 'todo')
      + '</div>';
  }

  /* -----------------------------------------------------------------------
     Modal de aislamiento · paso 1
     --------------------------------------------------------------------- */
  function isolationStep1(state, userId) {
    const u = D.USERS[userId];
    const role = D.ROLES[state.role];
    const f = state.isolation;

    /* El rol insuficiente se explica aquí, no con un botón muerto. */
    if (!role.canIsolate) {
      return open(
        '<div class="modal__head on-dark">'
        + '<div class="modal__eyebrow">' + icon('lock', 18) + '<span class="badge badge--neutral">Paso 1 de 2</span></div>'
        + '<h2 class="modal__title" id="mdTitle">Aislamiento no disponible para tu rol</h2>'
        + '<p class="modal__lede" id="mdLede">Permiso denegado por matriz de roles (RBAC-03)</p></div>'
        + '<div class="modal__body">'
        + U.notice('block', 'triangle',
          '<strong>Tu sesión está autenticada como ' + esc(role.label) + '.</strong> El aislamiento de una cuenta clínica '
          + 'exige el rol <strong>Coordinador SOC</strong>. El rol junior puede investigar, copiar la evidencia del árbol de '
          + 'decisión, escalar al CISO y abrir el ticket, pero no ejecutar la mitigación.')
        + '<p class="meta">Esta denegación también queda registrada: un intento de aislamiento fuera de rol es un evento de '
        + 'auditoría, no un error silencioso.</p></div>'
        + '<div class="modal__foot"><span class="tiny mono">' + esc(role.mail) + '</span>'
        + '<div class="row" style="gap:12px"><button type="button" class="btn btn--secondary" data-close="1">Cancelar y volver</button>'
        + '<button type="button" class="btn btn--primary" data-close="1" data-goto-after="#/historial?u=' + esc(userId) + '">'
        + 'Ver el historial del usuario</button></div></div>'
      );
    }

    const err = f.errors || {};

    return open(
      '<div class="modal__head">'
      + '<div class="modal__eyebrow">' + icon('lock', 18) + '<span class="badge badge--neutral">Paso 1 de 2</span>'
      + stepper(1) + '</div>'
      + '<h2 class="modal__title" id="mdTitle">Aislar la cuenta ' + esc(userId) + '</h2>'
      + '<p class="modal__lede" id="mdLede">Aislamiento de sesión · la cuenta se conserva y el historial permanece accesible</p></div>'

      + '<div class="modal__body">'
      + U.notice('rule', 'shield',
        '<strong>Qué va a pasar.</strong> Se revocarán las sesiones activas de <strong>' + esc(userId) + '</strong>, se bloqueará '
        + 'el acceso al historial clínico y al módulo de prescripción, y el titular recibirá una notificación. La cuenta '
        + '<strong>no se elimina</strong>: la reversión es parte del diseño. Todo queda en bitácora con tu identidad.')

      + '<div class="summarybox">' + U.summaryRow('Cuenta', esc(u.full))
      + U.summaryRow('Identificador', '<span class="mono">' + esc(u.id) + '</span>')
      + U.summaryRow('Unidad', esc(u.dept))
      + U.summaryRow('Motivo de la mitigación', 'Credencial comprometida según INC-2026-0417')
      + U.summaryRow('Operadora', esc(role.name) + ' · ' + esc(role.label))
      + '</div>'

      + '<div>'
      + '<p class="label-caps" style="margin-bottom:8px">Impacto inmediato</p>'
      + '<ul class="impactlist">'
      + '<li>' + icon('triangle', 14) + '<span>Se revocan <strong>todas</strong> las sesiones activas de la cuenta.</span></li>'
      + '<li>' + icon('triangle', 14) + '<span>Bloquea el acceso a historial clínico, prescripción y resultados de laboratorio.</span></li>'
      + '<li>' + icon('triangle', 14) + '<span>Si la cuenta está en turno, la computerized clinical work se detiene: avisa al jefe de servicio.</span></li>'
      + '<li>' + icon('check', 14) + '<span>El historial forense de 180 días sigue disponible para la investigación.</span></li>'
      + '</ul></div>'

      + '<div class="field">'
      + '<label class="field__label" for="mReason">Motivo de la mitigación <span class="field__req" aria-hidden="true">*</span></label>'
      + '<textarea class="textarea" id="mReason" name="reason" aria-describedby="mReasonHelp mReasonErr" placeholder="Ej. Credencial comprometida confirmada: 14 intentos fallidos desde ASN 60729 (Alemania) y posterior acceso exitoso desde IP no autorizada.">' + esc(f.reason) + '</textarea>'
      + '<span class="field__hint" id="mReasonHelp">Mínimo 30 caracteres. Este texto se copia literalmente al ticket y a la notificación al titular.</span>'
      + '<span class="field__error" id="mReasonErr"' + (err.reason ? '' : ' hidden') + '>' + (err.reason ? icon('triangle', 14) + esc(err.reason) : '') + '</span>'
      + '</div>'

      + '<div class="field">'
      + '<label class="field__label" for="mReauth">Re-autenticación del operador <span class="field__req" aria-hidden="true">*</span></label>'
      + '<input class="input" type="password" id="mReauth" name="reauth" autocomplete="current-password" value="' + esc(f.reauth)
      + '" aria-describedby="mReauthHelp mReauthErr" placeholder="Contraseña de dominio">'
      + '<span class="field__hint" id="mReauthHelp">Se valida contra Keycloak antes de aceptar el paso 2. Se guarda sólo el resultado, nunca el secreto.</span>'
      + '<span class="field__error" id="mReauthErr"' + (err.reauth ? '' : ' hidden') + '>' + (err.reauth ? icon('triangle', 14) + esc(err.reauth) : '') + '</span>'
      + '</div>'

      + '<label class="checkline"><input type="checkbox" name="notify" id="mNotify"' + (f.notify ? ' checked' : '') + '>'
      + '<span class="checkline__text">Notificar al jefe de servicio y al titular por el canal clínico.</span></label>'
      + '<label class="checkline"><input type="checkbox" name="evidence" id="mEvidence"' + (f.evidence ? ' checked' : '') + '>'
      + '<span class="checkline__text">Adjuntar al expediente la ruta completa del árbol de decisión (caja blanca).</span></label>'
      + '</div>'

      + '<div class="modal__foot">'
      + '<span class="tiny">El paso 2 pedirá escribir la palabra de confirmación.</span>'
      + '<div class="row" style="gap:12px">'
      + '<button type="button" class="btn btn--ghost" data-close="1">Cancelar y volver</button>'
      + '<button type="button" class="btn btn--primary" data-action="iso-next">Continuar al paso 2</button>'
      + '</div></div>'
    );
  }

  /* -----------------------------------------------------------------------
     Modal de aislamiento · paso 2
     --------------------------------------------------------------------- */
  function isolationStep2(state, userId) {
    const u = D.USERS[userId];
    const role = D.ROLES[state.role];
    const f = state.isolation;
    const matches = f.confirm.trim().toUpperCase() === 'AISLAR';
    const pct = matches ? 100 : f.confirm ? Math.min(90, Math.round(f.confirm.length / 5 * 90)) : 0;

    return open(
      '<div class="modal__head">'
      + '<div class="modal__eyebrow">' + icon('lock', 18) + '<span class="badge badge--neutral">Paso 2 de 2</span>'
      + stepper(2) + '</div>'
      + '<h2 class="modal__title" id="mdTitle">Confirmación explícita</h2>'
      + '<p class="modal__lede" id="mdLede">Último control antes de ejecutar la mitigación sobre ' + esc(u.full) + '</p></div>'

      + '<div class="modal__body">'
      + '<div class="summarybox">' + U.summaryRow('Cuenta', esc(u.id))
      + U.summaryRow('Unidad', esc(u.dept))
      + U.summaryRow('Motivo', '<span style="font-weight:400">' + esc(f.reason) + '</span>')
      + U.summaryRow('Notificación clínica', f.notify ? 'Se enviará' : 'No se enviará')
      + U.summaryRow('Evidencia adjunta', f.evidence ? 'Árbol de decisión completo' : 'No adjunta')
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
      + '<span class="field__hint" id="mConfirmHelp">Coincidencia literal, sin espacios. Distingue mayúsculas de minúsculas.</span>'
      + '</div></div>'

      + '<div class="modal__foot">'
      + '<button type="button" class="btn btn--ghost" data-action="iso-back">' + icon('back', 14)
      + 'Volver al paso 1</button>'
      + '<div class="row" style="gap:12px">'
      + '<button type="button" class="btn btn--ghost" data-close="1">Cancelar y volver</button>'
      + '<button type="button" class="btn btn--danger" data-action="iso-confirm"' + (matches ? '' : ' disabled aria-disabled="true"')
      + '>' + icon('lock', 16) + 'Ejecutar aislamiento</button>'
      + '</div></div>'
    );
  }

  /* -----------------------------------------------------------------------
     Modal BR-002 · unidad crítica protegida
     --------------------------------------------------------------------- */
  function criticalUnit(state, userId) {
    const u = D.USERS[userId];
    const role = D.ROLES[state.role];

    return open(
      '<div class="modal__head">'
      + '<div class="modal__eyebrow">' + icon('triangle', 18) + '<span class="badge badge--outline-critical">BR-002</span>'
      + '<span class="badge badge--neutral">Operación rechazada</span></div>'
      + '<h2 class="modal__title" id="mdTitle">No se puede aislar una cuenta de unidad crítica</h2>'
      + '<p class="modal__lede" id="mdLede">Regla de negocio BR-002 · Política de continuidad clínica</p></div>'

      + '<div class="modal__body">'
      + U.notice('block', 'triangle',
        '<strong>El aislamiento por software está prohibido en unidades críticas.</strong> Una cuenta aislada durante un turno '
        + 'detiene la atención: el bloqueo se convierte en el incidente. La plataforma no puede aceptar ese riesgo, por muy alto '
        + 'que sea el puntaje de riesgo de la sesión.')

      + '<div class="summarybox">' + U.summaryRow('Cuenta rechazada', esc(u.full))
      + U.summaryRow('Identificador', '<span class="mono">' + esc(u.id) + '</span>')
      + U.summaryRow('Rol del titular', esc(u.job))
      + U.summaryRow('Unidad', '<span class="badge badge--outline-critical">' + icon('triangle', 13)
        + esc(u.unit.toUpperCase()) + '</span>')
      + U.summaryRow('Operadora que lo intentó', esc(role.name) + ' · ' + esc(role.label))
      + U.summaryRow('Puntaje de riesgo', '<span class="mono">'
        + (D.ALERTS.find(a => a.user === userId) || { risk: 0 }).risk.toFixed(2) + ' / 1.00</span>')
      + '</div>'

      + '<div class="stack stack--sm">'
      + '<p class="label-caps">Unidades protegidas por la regla</p>'
      + '<div class="row" style="gap:8px">'
      + D.CRITICAL_UNITS.map(x => '<span class="badge badge--outline-critical">' + icon('triangle', 13)
        + esc(x.toUpperCase()) + '</span>').join('')
      + '</div></div>'

      + '<div>'
      + '<p class="label-caps" style="margin-bottom:8px">Qué puedes hacer en su lugar</p>'
      + '<ul class="impactlist">'
      + '<li>' + icon('check', 14) + '<span><strong>Revocar sólo la sesión sospechosa</strong>, sin tocar la cuenta ni el turno.</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Forzar re-autenticación MFA</strong> en el siguiente acceso de la cuenta.</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Escalar al CISO</strong> y abrir incidente para revisión humana.</span></li>'
      + '<li>' + icon('check', 14) + '<span><strong>Avisar al jefe de servicio</strong> para que valide si la actividad es legítima.</span></li>'
      + '</ul></div>'

      + '<div class="notice notice--rule">' + icon('info', 16)
      + '<div>La mitigación manual de una unidad crítica exige dos firmas electrónicas y la presencia del jefe de servicio. '
      + 'Este prototipo no ofrece esa vía: muestra el rechazo normativo y las alternativas.</div></div>'
      + '</div>'

      + '<div class="modal__foot">'
      + '<span class="tiny mono">bitácora: BR-002 denegado · registro 88231</span>'
      + '<div class="row" style="gap:12px">'
      + '<button type="button" class="btn btn--ghost" data-close="1">Cancelar y volver</button>'
      + '<button type="button" class="btn btn--secondary" data-action="escalate" data-close="1">Escalar al CISO</button>'
      + '<button type="button" class="btn btn--primary" data-action="revoke-session" data-user="' + esc(userId) + '" data-close="1">'
      + 'Revocar sólo la sesión sospechosa</button>'
      + '</div></div>'
    );
  }

  /* -----------------------------------------------------------------------
     Confirmación genérica para acciones de configuración (whitelist)
     --------------------------------------------------------------------- */
  function confirmAction(opts) {
    return open(
      '<div class="modal__head">'
      + '<div class="modal__eyebrow">' + icon(opts.icon || 'shield', 18)
      + '<span class="badge badge--neutral">Confirmación</span></div>'
      + '<h2 class="modal__title" id="mdTitle">' + esc(opts.title) + '</h2>'
      + '<p class="modal__lede" id="mdLede">' + esc(opts.lede || '') + '</p></div>'
      + '<div class="modal__body">' + U.notice('warn', 'triangle', opts.body) + '</div>'
      + '<div class="modal__foot">'
      + '<span class="tiny">La acción queda registrada con tu identidad y la hora.</span>'
      + '<div class="row" style="gap:12px">'
      + '<button type="button" class="btn btn--ghost" data-close="1">Cancelar y volver</button>'
      + '<button type="button" class="btn btn--primary" data-action="' + esc(opts.action) + '" data-arg="'
      + esc(opts.arg || '') + '">' + esc(opts.confirmLabel || 'Confirmar') + '</button>'
      + '</div></div>'
    );
  }

  return { open, close, isolationStep1, isolationStep2, criticalUnit, confirmAction, stepper };
})();
