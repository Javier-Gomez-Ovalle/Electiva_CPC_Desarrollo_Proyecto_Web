/* =========================================================================
   HeraUEBA · data.js
   Iconografía y datos del escenario de demostración.
   Escenario: 2026-10-04, Clínica Central, Nodo SOC-BOG-01.
   ========================================================================= */
window.HERA = (function () {
  'use strict';

  /* --- Iconos: SVG en línea, trazo 1.5px, sin emoji -------------------- */
  const PATHS = {
    grid: '<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    user: '<path d="M16 20v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.4"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5z"/>',
    lock: '<rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/>',
    unlock: '<rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M8 10.5V7.6a4 4 0 0 1 7.5-1.9"/>',
    triangle: '<path d="M10.3 3.9L2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4.5M12 17h.01"/>',
    circleDot: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.4 12.2l2.5 2.5 4.7-4.9"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    key: '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21M18 12v3M15 12v2"/>',
    flag: '<path d="M4 21V4M4 5h11l-1.6 3.5L15 12H4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5v-.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h.5"/>',
    download: '<path d="M12 3v12M7.5 10.5L12 15l4.5-4.5M4 20h16"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
    arrowDown: '<path d="M12 4v16M6 14l6 6 6-6"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.1-4.6M4 13a8 8 0 0 0 14.1 4.6"/><path d="M20 4v5h-5M4 20v-5h5"/>',
    filter: '<path d="M4 5h16l-6.2 7.3V19l-3.6 2v-8.7z"/>',
    tree: '<circle cx="12" cy="5" r="2.4"/><circle cx="6" cy="19" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="M12 7.4v3.6M12 11H6v5.6M12 11h6v5.6"/>',
    gavel: '<path d="M13.5 3.5l7 7M17 7l-3.6-3.6M10.4 6.4L4 12.8l3.6 3.6 6.4-6.4"/><path d="M3 21h11"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1 1 1.7l.1.5h5l.1-.5c.1-.6.4-1.2 1-1.7A6 6 0 0 0 12 3z"/>',
    hospital: '<path d="M3 20V8l9-5 9 5v12"/><path d="M12 9v6M9 12h6"/>',
    shield: '<path d="M12 3l7.5 3v6.1c0 4.4-3 8-7.5 9-4.5-1-7.5-4.6-7.5-9V6L12 3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    fingerprint: '<path d="M12 4.5a7.5 7.5 0 0 0-7.5 7.5v2M19.5 12a7.5 7.5 0 0 0-3.4-6.2"/><path d="M8 12a4 4 0 0 1 8 0c0 3-.6 5.6-1.6 7.6M12 12v3M7.4 16.4c-.6-1.3-.9-2.8-.9-4.4"/>',
    bell: '<path d="M18 15V10a6 6 0 1 0-12 0v5l-2 3h16l-2-3z"/><path d="M10 21h4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10.5 11v5M13.5 11v5"/>',
    ticket: '<path d="M4 8.5V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 7v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-7z"/><path d="M13 7v10"/>',
    activity: '<path d="M3 12h4l2.5-6 4 12L16 12h5"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>'
  };
  const icon = (n, size) => '<svg width="' + (size || 18) + '" height="' + (size || 18) +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[n] || '') + '</svg>';

  /* --- Unidades protegidas por la regla BR-002 -------------------------- */
  const CRITICAL_UNITS = ['UCI', 'Quirófano', 'Urgencias'];

  /* --- Cuentas ---------------------------------------------------------- */
  const USERS = {
    'mg.ramirez': {
      id: 'mg.ramirez', initials: 'MR', full: 'Dra. María Fernanda Ramírez S.',
      job: 'Médica especialista', dept: 'Neurología', unit: 'Neurología',
      floor: 'Piso 4 · Ala norte', shift: 'Mañana 07:00–13:00',
      mfa: true, tenure: '4 años',
      lastLegit: '2026-10-04 07:02 COT · 190.24.9.14 (CO)',
      email: 'mg.ramirez@hospital.local'
    },
    'enf.castillo': {
      id: 'enf.castillo', initials: 'EC', full: 'Enf. Sandra Milagros Castillo R.',
      job: 'Enfermera espectadora', dept: 'Urgencias', unit: 'Urgencias',
      floor: 'Urgencias · Boxes 1–12', shift: 'Noche 19:00–07:00',
      mfa: false, tenure: '7 años',
      lastLegit: '2026-10-03 21:48 COT · 190.24.11.5 (CO)',
      email: 'enf.castillo@hospital.local'
    },
    'adm.sistema': {
      id: 'adm.sistema', initials: 'AS', full: 'Ing. Andrés Felipe Systemas',
      job: 'Administrador de sistemas', dept: 'TI · Infraestructura', unit: 'Quirófano',
      floor: 'Quirófano · Central de esterilización', shift: 'Programado 08:00–17:00',
      mfa: false, tenure: '2 años',
      lastLegit: '2026-10-04 06:55 COT · 10.20.0.14 (intranet)',
      email: 'adm.sistema@hospital.local'
    },
    'enf.mendoza': {
      id: 'enf.mendoza', initials: 'EM', full: 'Enf. Julián Mendoza Ortiz',
      job: 'Enfermero', dept: 'Urgencias', unit: 'Urgencias',
      floor: 'Urgencias · Boxes 1–12', shift: 'Tarde 13:00–19:00',
      mfa: true, tenure: '1 año',
      lastLegit: '2026-10-04 06:12 COT · 190.24.12.88 (CO)',
      email: 'enf.mendoza@hospital.local'
    },
    'lab.tech': {
      id: 'lab.tech', initials: 'LT', full: 'Téc. Pilar Andrea Lotero',
      job: 'Técnica de laboratorio', dept: 'Laboratorio', unit: 'Laboratorio',
      floor: 'Laboratorio · Piso -1', shift: 'Mañana 06:00–14:00',
      mfa: true, tenure: '3 años',
      lastLegit: '2026-10-04 05:58 COT · 10.20.4.77 (intranet)',
      email: 'lab.tech@hospital.local'
    }
  };

  /* --- Alertas de la ventana de 24 h ------------------------------------ */
  const ALERTS = [
    {
      id: 'INC-2026-0417', sev: 'critico', user: 'mg.ramirez', risk: 0.94,
      at: '2026-10-04 14:31:09', time: '14:31',
      ip: '185.220.101.47', country: 'Alemania', cc: 'DE',
      asn: 'ASN 60729 · Tor Exit Node Network',
      rule: 'intentos_fallidos_15m > 8 AND ventana_entre_intentos_min < 2 AND pais_origen fuera de whitelist',
      ruleShort: '8 intentos fallidos en 2 min + país fuera de la whitelist',
      status: 'Abierta', title: 'Intento de acceso no autorizado'
    },
    {
      id: 'INC-2026-0418', sev: 'critico', user: 'enf.castillo', risk: 0.88,
      at: '2026-10-04 14:12:41', time: '14:12',
      ip: '45.132.192.10', country: 'Países Bajos', cc: 'NL',
      asn: 'ASN 9009 · M247 Europe SRL',
      rule: 'asn_proveedor_sospechoso AND dispositivo_nunca_visto AND mfa_no_registrada',
      ruleShort: 'Login desde ASN de proveedor + dispositivo nunca visto',
      status: 'Abierta', title: 'Inicio de sesión con dispositivo no registrado'
    },
    {
      id: 'INC-2026-0416', sev: 'critico', user: 'adm.sistema', risk: 0.91,
      at: '2026-10-04 13:47:26', time: '13:47',
      ip: '103.27.184.6', country: 'Vietnam', cc: 'VN',
      asn: 'ASN 45899 · VNPT Smart Cloud',
      rule: 'aislamiento_previo_fallido >= 3 AND mfa_deshabilitada AND escritura_en_historial_clinico',
      ruleShort: 'Aislamiento fallido 3 veces + MFA deshabilitado',
      status: 'Escalada', title: 'Escritura en historial clínico con MFA deshabilitada'
    },
    {
      id: 'INC-2026-0415', sev: 'media', user: 'enf.mendoza', risk: 0.61,
      at: '2026-10-04 13:20:03', time: '13:20',
      ip: '181.60.72.14', country: 'Panamá', cc: 'PA',
      asn: 'ASN 26459 · Cable Panamá',
      rule: 'geovelocidad > 900 km/h entre dos sesiones activas',
      ruleShort: 'Imposible de viaje (desplazamiento físico inconsistente)',
      status: 'En observación', title: 'Desplazamiento geográfico físicamente imposible'
    },
    {
      id: 'INC-2026-0414', sev: 'media', user: 'lab.tech', risk: 0.55,
      at: '2026-10-04 12:58:55', time: '12:58',
      ip: '88.26.244.19', country: 'España', cc: 'ES',
      asn: 'ASN 12956 · Telefónica',
      rule: 'geovelocidad > 700 km/h entre dos sesiones activas',
      ruleShort: 'Geovelocidad anómala entre dos sesiones activas',
      status: 'En observación', title: 'Dos sesiones simultáneas en países distintos'
    }
  ];

  /* --- Árboles de decisión explicables (caja blanca) -------------------- */
  const THRESHOLD = 0.98;   /* BR-001: por encima de este valor el motor NUNCA bloquea solo */

  const TREES = {
    'INC-2026-0417': {
      nodes: [
        { i: 1, rule: 'intentos_fallidos_15m > 8', obs: '14', v: 'true' },
        { i: 2, rule: 'ventana_entre_intentos_min < 2', obs: '1.4 min', v: 'true' },
        { i: 3, rule: 'pais_origen ≠ whitelist_usuario', obs: 'Alemania ≠ Colombia', v: 'true' },
        { i: 4, rule: 'mfa_activo == true', obs: 'false — bypass por API REST', v: 'false' },
        { i: 5, rule: 'usuario_unidad_critica?', obs: 'false — no está en UCI ni Quirófano', v: 'verify' }
      ],
      verdict: 'CREDENCIAL COMPROMETIDA', factor: 0.94, incidence: 'ALTA',
      globalRule: 'intentos > 8   AND   ventana < 2 min   AND   pais ≠ Colombia',
      branch: 'Rama izquierda del árbol',
      reading: 'El modelo no clasificó la sesión por la IP aislada, sino por la combinación de 14 intentos fallidos concentrados en 90 segundos desde un país no autorizado. El nodo 4 falla en falso porque el acceso se produjo por la API REST de interoperabilidad, que no exige MFA.'
    },
    'INC-2026-0418': {
      nodes: [
        { i: 1, rule: 'asn_origen ∈ feed_abuse_conocido', obs: 'ASN 9009 · 3 nodos reportados', v: 'true' },
        { i: 2, rule: 'dispositivo_nunca_visto', obs: 'true · fingerprint 4f2a…9c1e', v: 'true' },
        { i: 3, rule: 'mfa_no_registrada', obs: 'true · methods = [password]', v: 'true' },
        { i: 4, rule: 'pais_origen ≠ whitelist_usuario', obs: 'Países Bajos ≠ Colombia', v: 'true' },
        { i: 5, rule: 'unidad_en_lista_critica', obs: 'true — Urgencias (BR-002)', v: 'block' }
      ],
      verdict: 'POSIBLE COMPROMISO DE CREDENCIAL', factor: 0.88, incidence: 'ALTA',
      globalRule: 'asn_abuse   AND   dispositivo_nuevo   AND   mfa_ausente',
      branch: 'Rama izquierda, detenida por BR-002 en el nodo 5',
      reading: 'Los cuatro nodos predictivos se cumplen, pero el nodo 5 invoca la regla de negocio BR-002: la titular pertenece a Urgencias, unidad clasificada como crítica. El motor no propone aislamiento; propone escalamiento normativo al CISO.'
    },
    'INC-2026-0416': {
      nodes: [
        { i: 1, rule: 'aislamiento_previo_fallido >= 3', obs: '3 intentos · 01, 02 y 03 oct', v: 'true' },
        { i: 2, rule: 'mfa_habilitada', obs: 'false — desactivada por el titular', v: 'false' },
        { i: 3, rule: 'privilegios_sobre_recursos_clinicos', obs: 'true — escritura en HISTORIAL_CLINICO', v: 'true' },
        { i: 4, rule: 'pais_origen ≠ whitelist_institucional', obs: 'Vietnam ≠ Colombia', v: 'true' },
        { i: 5, rule: 'unidad_en_lista_critica', obs: 'true — Quirófano (BR-002)', v: 'block' }
      ],
      verdict: 'COMPROMISO DE CUENTA ADMINISTRATIVA', factor: 0.91, incidence: 'CRÍTICA',
      globalRule: 'aislamiento_fallido   AND   escritura_clinico   AND   mfa_ausente',
      branch: 'Rama izquierda, detenida por BR-002 en el nodo 5',
      reading: 'El puntaje más alto del lote no proviene de la geolocalización sino del historial: tres aislamientos previos fracasaron sin que nadie escalara. El nodo 5 detiene el aislamiento por BR-002 (Quirófano) y obliga a la ruta de escalamiento al CISO.'
    }
  };

  /* --- Telemetría por alerta --------------------------------------------- */
  function eventsFor(alertId) {
    if (alertId === 'INC-2026-0417') {
      return [
        {
          t: '14:31:09', k: 'crit', icon: 'unlock', verdict: 'ANOMALÍA',
          title: 'Inicio de sesión exitoso con credencial comprometida',
          meta: '185.220.101.47 · ASN 60729 · Alemania · dispositivo nuevo · Firefox 115 / Linux',
          hash: 'sha256:7f4a…92b',
          payload: {
            event_id: 'EVT-20261004-88219', client_ip: '185.220.101.47',
            asn_org: 'Tor Exit Node Network / VPS Host', risk_score: 0.94,
            session_id: 'a7f3-91c2-e04b', mfa: 'bypassed_via_rest_api',
            heuristics: ['NEW_COUNTRY', 'TOR_KNOWN_EXIT', 'SPRAY_MATCH_CONFIRMED'],
            user_agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'
          }
        },
        { t: '14:30:48', k: 'fail', icon: 'key', verdict: 'FALLO', title: '14.º fallo de autenticación consecutivo', meta: '185.220.101.47 · intento 14/15 · bloqueo de cuenta inminente en 60 s' },
        { t: '14:29:51', k: 'fail', icon: 'lock', verdict: 'FALLO', title: 'Inicio de sesión fallido (contraseña incorrecta)', meta: '185.220.101.47 · credenciales de dominio no coincidentes' },
        { t: '14:29:14', k: 'fail', icon: 'key', verdict: 'FALLO', title: 'Ráfaga de intentos: 8 fallos en 37 s', meta: 'Spray de contraseña contra mg.ramirez · 6 cuentas contiguas testeadas' },
        { t: '14:28:36', k: 'ok', icon: 'globe', verdict: 'CONTEXTO', title: 'Primera conexión del ASN 60729 contra el dominio', meta: 'El ASN no registraba tráfico previo contra hospital.local' },
        { t: '07:02:14', k: 'ok', icon: 'check', verdict: 'ÉXITO', title: 'Inicio de sesión exitoso desde el terminal de turno', meta: '190.24.9.14 · Colombia · Chrome 141 / Windows 11 · MFA correcta' }
      ];
    }
    const a = ALERTS.find(x => x.id === alertId) || ALERTS[1];
    return [
      {
        t: a.time + ':41', k: 'crit', icon: 'unlock', verdict: 'ANOMALÍA',
        title: a.title, meta: a.ip + ' · ' + a.asn + ' · ' + a.country + ' · ' + a.ruleShort,
        hash: 'sha256:1c8e…4d7a',
        payload: {
          event_id: 'EVT-20261004-881' + Math.round(a.risk * 100), client_ip: a.ip,
          asn_org: a.asn, risk_score: a.risk, unit: USERS[a.user].unit,
          session_id: 'b91e-77d0-4c2f', mfa: 'not_enrolled',
          heuristics: [a.rule.split(' AND ')[0].trim(), 'UNIT_CRITICAL_GUARD']
        }
      },
      { t: a.time + ':02', k: 'fail', icon: 'key', verdict: 'FALLO', title: 'Desafío MFA no presentado', meta: 'La cuenta no tiene métodos MFA registrados · ' + a.ip },
      { t: a.time + ':00', k: 'fail', icon: 'fingerprint', verdict: 'FALLO', title: 'Impresión digital de dispositivo desconocida', meta: 'fingerprint 4f2a…9c1e · nunca visto en el histórico de la cuenta' },
      { t: 'ayer 21:48', k: 'ok', icon: 'check', verdict: 'ÉXITO', title: 'Cierre de sesión legítimo', meta: '190.24.11.5 · Colombia · terminal de turno' }
    ];
  }

  /* --- Historial forense por cuenta ------------------------------------- */
  const HISTORY = {
    'mg.ramirez': { total: 1284, logins: 612, fails: 88, countries: 'CO (98.9 %), ES, DE', session: 'a7f3-91c2-e04b', lastAnomaly: 'hace 2 h' },
    'enf.castillo': { total: 2417, logins: 1103, fails: 12, countries: 'CO (99.6 %), NL', session: '4c18-0b7d-ea92', lastAnomaly: 'hace 20 min' },
    'adm.sistema': { total: 903, logins: 512, fails: 31, countries: 'CO (94.1 %), VN', session: '—', lastAnomaly: 'hace 45 min' },
    'enf.mendoza': { total: 1892, logins: 968, fails: 6, countries: 'CO (100 %), PA', session: 'd220-5fa3-11c7', lastAnomaly: 'hace 1 h' },
    'lab.tech': { total: 1604, logins: 874, fails: 19, countries: 'CO (97.2 %), ES', session: '88be-31fa-0d4c', lastAnomaly: 'hace 1 h 34 min' }
  };

  /* --- Whitelist geográfica --------------------------------------------- */
  const WHITELIST = [
    { cidr: '190.24.0.0/16', country: 'Colombia', cc: 'CO', scope: 'Institucional', note: 'Rango asignado al hospital por la UIT', until: 'Permanente', by: 'Carla M. Restrepo', state: 'activa' },
    { cidr: '10.20.0.0/16', country: 'Intranet hospitalaria', cc: 'INT', scope: 'Todos los usuarios', note: 'Red interna, nunca expuesta a Internet', until: 'Permanente', by: 'Carla M. Restrepo', state: 'activa' },
    { cidr: '181.60.72.0/22', country: 'Panamá', cc: 'PA', scope: 'Urgencias · Satélital', note: 'Enlace de Disaster Recovery con la UCI móvil', until: '2027-03-01', by: 'Comité de Ciberseguridad', state: 'activa' },
    { cidr: '45.132.192.0/24', country: 'Países Bajos', cc: 'NL', scope: 'Proveedor de videovigilancia', note: 'Contrato marco 2025-114 · solo cámaras, no acceso clínico', until: '2026-11-15', by: 'Carla M. Restrepo', state: 'activa' },
    { cidr: '103.27.184.0/24', country: 'Vietnam', cc: 'VN', scope: 'Soporte externo TI', note: 'Ventana de mantenimiento acordada', until: '2026-10-12', by: 'Carla M. Restrepo', state: 'por vencer' },
    { cidr: '88.26.240.0/20', country: 'España', cc: 'ES', scope: 'Laboratorio · socio', note: 'Interoperabilidad con el laboratorio de referencia', until: '2026-10-04', by: 'Comité de Ciberseguridad', state: 'expirada' }
  ];

  /* --- Roles (RBAC) ------------------------------------------------------ */
  const ROLES = {
    coordinador: { name: 'Carla M. Restrepo', label: 'Coordinadora SOC', initials: 'CR', canIsolate: true, mail: 'carla.restrepo@hospital.local' },
    junior: { name: 'Diego A. Fuentes', label: 'Analista Junior SOC', initials: 'DF', canIsolate: false, mail: 'diego.fuentes@hospital.local' }
  };

  return {
    icon, CRITICAL_UNITS, USERS, ALERTS, TREES, THRESHOLD,
    eventsFor, HISTORY, WHITELIST, ROLES
  };
})();
