-- =========================================================================
-- HeraUEBA · database/seed.sql
-- Datos iniciales del escenario clínico de demostración:
-- Clínica Central · Nodo SOC-BOG-01.
-- Fuente de autoridad: Stitch-prototype/prototype/assets/data.js
-- =========================================================================

BEGIN;

-- 1. ROLES (RBAC)
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'CISO', 'Patrocinador ejecutivo y director de ciberseguridad clínica. Auditoría y escalamiento.'),
(2, 'Coordinador SOC', 'Operador administrativo y resolutivo. Facultado para aislar cuentas y gestionar whitelist.'),
(3, 'Analista Junior SOC', 'Operador de monitoreo en turno (nivel Junior). Investigación, filtrado y exportación sin facultad de bloqueo.'),
(4, 'Personal Clínico', 'Titular de cuenta hospitalaria monitoreada por el motor UEBA.'),
(5, 'Analista Senior SOC', 'Analista forense de nivel Senior. Investigación avanzada de telemetría e incidentes sin facultad de aislamiento.')
ON CONFLICT (role_id) DO NOTHING;

SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

-- 2. UNITS (Unidades Clínicas con protección BR-002 en UCI, Quirófano, Urgencias)
INSERT INTO units (unit_id, unit_name, is_critical, unit_type, department) VALUES
(1, 'UCI', TRUE, 'ICU', 'Unidad de Cuidados Intensivos'),
(2, 'Quirófano', TRUE, 'OR', 'TI · Infraestructura'),
(3, 'Urgencias', TRUE, 'ER', 'Urgencias'),
(4, 'Neurología', FALSE, 'OTHER', 'Neurología'),
(5, 'Laboratorio', FALSE, 'OTHER', 'Laboratorio'),
(6, 'SOC', FALSE, 'OTHER', 'Centro de Operaciones de Seguridad')
ON CONFLICT (unit_id) DO NOTHING;

SELECT setval('units_unit_id_seq', (SELECT MAX(unit_id) FROM units));

-- 3. USERS (Titulares del escenario y Operadores SOC)
INSERT INTO users (
    user_id, username, email, full_name, initials, job_title, institution, phone,
    floor_location, shift_schedule, mfa_enabled, tenure, last_legit_desc,
    unit_id, role_id, active, is_isolated, password_hash, keycloak_id, ad_guid, last_login_at
) VALUES
(1, 'mg.ramirez', 'mg.ramirez@hospital.local', 'Dra. María Fernanda Ramírez S.', 'MR',
 'Médica especialista', 'Clínica Central · Sede Universitaria', '+57 (601) 742-8810',
 'Piso 4 · Ala norte', 'Mañana 07:00–13:00', TRUE, '4 años',
 '2026-10-04 07:02 COT · 190.24.9.14 (CO)', 4, 4, TRUE, FALSE,
 'demo-pass-2026', 'kc-mg-ramirez-01', 'ad-guid-1001', NOW() - INTERVAL '2 hours'),

(2, 'enf.castillo', 'enf.castillo@hospital.local', 'Enf. Sandra Milagros Castillo R.', 'EC',
 'Enfermera espectadora', 'Clínica Central · Sede Universitaria', '+57 (601) 742-8812',
 'Urgencias · Boxes 1–12', 'Noche 19:00–07:00', FALSE, '7 años',
 '2026-10-03 21:48 COT · 190.24.11.5 (CO)', 3, 4, TRUE, FALSE,
 'demo-pass-2026', 'kc-enf-castillo-02', 'ad-guid-1002', NOW() - INTERVAL '1 hour'),

(3, 'adm.sistema', 'adm.sistema@hospital.local', 'Ing. Andrés Felipe Systemas', 'AS',
 'Administrador de sistemas', 'Clínica Central · Sede Universitaria', '+57 (601) 742-8815',
 'Quirófano · Central de esterilización', 'Programado 08:00–17:00', FALSE, '2 años',
 '2026-10-04 06:55 COT · 10.20.0.14 (intranet)', 2, 4, TRUE, FALSE,
 'demo-pass-2026', 'kc-adm-sistema-03', 'ad-guid-1003', NOW() - INTERVAL '3 hours'),

(4, 'enf.mendoza', 'enf.mendoza@hospital.local', 'Enf. Julián Mendoza Ortiz', 'EM',
 'Enfermero', 'Clínica Central · Sede Universitaria', '+57 (601) 742-8818',
 'Urgencias · Boxes 1–12', 'Tarde 13:00–19:00', TRUE, '1 año',
 '2026-10-04 06:12 COT · 190.24.12.88 (CO)', 3, 4, TRUE, FALSE,
 'demo-pass-2026', 'kc-enf-mendoza-04', 'ad-guid-1004', NOW() - INTERVAL '4 hours'),

(5, 'lab.tech', 'lab.tech@hospital.local', 'Téc. Pilar Andrea Lotero', 'LT',
 'Técnica de laboratorio', 'Clínica Central · Sede Universitaria', '+57 (601) 742-8820',
 'Laboratorio · Piso -1', 'Mañana 06:00–14:00', TRUE, '3 años',
 '2026-10-04 05:58 COT · 10.20.4.77 (intranet)', 5, 4, TRUE, FALSE,
 'demo-pass-2026', 'kc-lab-tech-05', 'ad-guid-1005', NOW() - INTERVAL '5 hours'),

(6, 'carla.restrepo', 'carla.restrepo@hospital.local', 'Carla M. Restrepo', 'CR',
 'Coordinadora SOC', 'Clínica Central · Nodo SOC-BOG-01', '+57 310 482 9104',
 'SOC · Piso 2', 'Permanente · Guardia Resolutiva', TRUE, '5 años',
 '2026-10-04 07:00 COT · 10.20.0.5 (intranet)', 6, 2, TRUE, FALSE,
 'demo-pass-2026', 'kc-carla-restrepo-06', 'ad-guid-1006', NOW() - INTERVAL '15 minutes'),

(7, 'diego.fuentes', 'diego.fuentes@hospital.local', 'Diego A. Fuentes', 'DF',
 'Analista Junior SOC', 'Clínica Central · Nodo SOC-BOG-01', '+57 315 890 2231',
 'SOC · Piso 2', 'Turno Diurno 06:00–18:00', TRUE, '1 año',
 '2026-10-04 06:00 COT · 10.20.0.8 (intranet)', 6, 3, TRUE, FALSE,
 'demo-pass-2026', 'kc-diego-fuentes-07', 'ad-guid-1007', NOW() - INTERVAL '10 minutes'),

(8, 'ciso.hospital', 'ciso@hospital.local', 'Dr. Roberto Gómez (CISO)', 'RG',
 'CISO / Director TI', 'Clínica Central · Dirección General', '+57 300 211 9001',
 'Dirección General', 'Ejecutivo', TRUE, '8 años',
 '2026-10-04 08:00 COT · 10.20.0.2 (intranet)', 6, 1, TRUE, FALSE,
 'demo-pass-2026', 'kc-ciso-08', 'ad-guid-1008', NOW() - INTERVAL '30 minutes'),

(9, 'valeria.soto', 'valeria.soto@hospital.local', 'Ing. Valeria Soto M.', 'VS',
 'Analista Senior SOC', 'Clínica Central · Nodo SOC-BOG-01', '+57 318 654 1190',
 'SOC · Piso 2 · Forense', 'Turno Nocturno 18:00–06:00', TRUE, '4 años',
 '2026-10-04 06:30 COT · 10.20.0.9 (intranet)', 6, 5, TRUE, FALSE,
 'demo-pass-2026', 'kc-valeria-soto-09', 'ad-guid-1009', NOW() - INTERVAL '12 minutes')
ON CONFLICT (user_id) DO NOTHING;

SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- 4. AUTH_EVENTS (Eventos en múltiples ventanas 1h, 24h, 7d, 30d, 180d para filtrado interactivo FR-002 / FR-003)
INSERT INTO auth_events (
    event_id, event_code, user_id, username_attempt, event_timestamp, display_time,
    timeline_kind, timeline_icon, verdict_label, title, meta_desc, payload_hash,
    ip_address, geo_country, geo_cc, asn, is_vpn, is_tor, outcome, auth_method, failure_count_window, raw_json
) VALUES
-- Eventos de mg.ramirez (INC-2026-0417) dentro de 1h y 24h
(1, 'EVT-20261004-88219', 1, 'mg.ramirez', NOW() - INTERVAL '25 minutes', '14:31:09',
 'crit', 'unlock', 'ANOMALÍA', 'Inicio de sesión exitoso con credencial comprometida',
 '185.220.101.47 · ASN 60729 · Alemania · dispositivo nuevo · Firefox 115 / Linux', 'sha256:7f4a…92b',
 '185.220.101.47', 'Alemania', 'DE', 'ASN 60729 · Tor Exit Node Network', TRUE, TRUE, 'success', 'password', 14,
 '{"event_id": "EVT-20261004-88219", "client_ip": "185.220.101.47", "asn_org": "Tor Exit Node Network / VPS Host", "risk_score": 0.94, "session_id": "a7f3-91c2-e04b", "mfa": "bypassed_via_rest_api", "heuristics": ["NEW_COUNTRY", "TOR_KNOWN_EXIT", "SPRAY_MATCH_CONFIRMED"], "user_agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0"}'::jsonb),

(2, 'EVT-20261004-88218', 1, 'mg.ramirez', NOW() - INTERVAL '26 minutes', '14:30:48',
 'fail', 'key', 'FALLO', '14.º fallo de autenticación consecutivo',
 '185.220.101.47 · intento 14/15 · bloqueo de cuenta inminente en 60 s', NULL,
 '185.220.101.47', 'Alemania', 'DE', 'ASN 60729 · Tor Exit Node Network', TRUE, TRUE, 'failed', 'password', 14, NULL),

(3, 'EVT-20261004-88217', 1, 'mg.ramirez', NOW() - INTERVAL '27 minutes', '14:29:51',
 'fail', 'lock', 'FALLO', 'Inicio de sesión fallido (contraseña incorrecta)',
 '185.220.101.47 · credenciales de dominio no coincidentes', NULL,
 '185.220.101.47', 'Alemania', 'DE', 'ASN 60729 · Tor Exit Node Network', TRUE, TRUE, 'failed', 'password', 10, NULL),

(4, 'EVT-20261004-88216', 1, 'mg.ramirez', NOW() - INTERVAL '28 minutes', '14:29:14',
 'fail', 'key', 'FALLO', 'Ráfaga de intentos: 8 fallos en 37 s',
 'Spray de contraseña contra mg.ramirez · 6 cuentas contiguas testeadas', NULL,
 '185.220.101.47', 'Alemania', 'DE', 'ASN 60729 · Tor Exit Node Network', TRUE, TRUE, 'failed', 'password', 8, NULL),

(5, 'EVT-20261004-88215', 1, 'mg.ramirez', NOW() - INTERVAL '29 minutes', '14:28:36',
 'ok', 'globe', 'CONTEXTO', 'Primera conexión del ASN 60729 contra el dominio',
 'El ASN no registraba tráfico previo contra hospital.local', NULL,
 '185.220.101.47', 'Alemania', 'DE', 'ASN 60729 · Tor Exit Node Network', TRUE, TRUE, 'success', 'sso', 0, NULL),

(6, 'EVT-20261004-88100', 1, 'mg.ramirez', NOW() - INTERVAL '7 hours', '07:02:14',
 'ok', 'check', 'ÉXITO', 'Inicio de sesión exitoso desde el terminal de turno',
 '190.24.9.14 · Colombia · Chrome 141 / Windows 11 · MFA correcta', NULL,
 '190.24.9.14', 'Colombia', 'CO', 'ASN 3816 · Colombia Telecomunicaciones', FALSE, FALSE, 'success', 'mfa', 0, NULL),

-- Eventos de enf.castillo (INC-2026-0418) dentro de 1h y 24h
(7, 'EVT-20261004-88188', 2, 'enf.castillo', NOW() - INTERVAL '45 minutes', '14:12:41',
 'crit', 'unlock', 'ANOMALÍA', 'Inicio de sesión con dispositivo no registrado',
 '45.132.192.10 · ASN 9009 · M247 Europe SRL · Países Bajos · Login desde ASN de proveedor + dispositivo nunca visto', 'sha256:1c8e…4d7a',
 '45.132.192.10', 'Países Bajos', 'NL', 'ASN 9009 · M247 Europe SRL', TRUE, FALSE, 'success', 'password', 2,
 '{"event_id": "EVT-20261004-88188", "client_ip": "45.132.192.10", "asn_org": "ASN 9009 · M247 Europe SRL", "risk_score": 0.88, "unit": "Urgencias", "session_id": "b91e-77d0-4c2f", "mfa": "not_enrolled", "heuristics": ["asn_proveedor_sospechoso", "UNIT_CRITICAL_GUARD"]}'::jsonb),

(8, 'EVT-20261004-88187', 2, 'enf.castillo', NOW() - INTERVAL '46 minutes', '14:12:02',
 'fail', 'key', 'FALLO', 'Desafío MFA no presentado',
 'La cuenta no tiene métodos MFA registrados · 45.132.192.10', NULL,
 '45.132.192.10', 'Países Bajos', 'NL', 'ASN 9009 · M247 Europe SRL', TRUE, FALSE, 'failed', 'mfa', 1, NULL),

(9, 'EVT-20261004-88186', 2, 'enf.castillo', NOW() - INTERVAL '47 minutes', '14:12:00',
 'fail', 'fingerprint', 'FALLO', 'Impresión digital de dispositivo desconocida',
 'fingerprint 4f2a…9c1e · nunca visto en el histórico de la cuenta', NULL,
 '45.132.192.10', 'Países Bajos', 'NL', 'ASN 9009 · M247 Europe SRL', TRUE, FALSE, 'failed', 'password', 1, NULL),

(10, 'EVT-20261003-88010', 2, 'enf.castillo', NOW() - INTERVAL '16 hours', 'ayer 21:48',
 'ok', 'check', 'ÉXITO', 'Cierre de sesión legítimo',
 '190.24.11.5 · Colombia · terminal de turno', NULL,
 '190.24.11.5', 'Colombia', 'CO', 'ASN 3816 · Colombia Telecomunicaciones', FALSE, FALSE, 'success', 'password', 0, NULL),

-- Eventos de adm.sistema (INC-2026-0416) en ventana > 1h pero < 24h
(11, 'EVT-20261004-88191', 3, 'adm.sistema', NOW() - INTERVAL '2 hours', '13:47:41',
 'crit', 'unlock', 'ANOMALÍA', 'Escritura en historial clínico con MFA deshabilitada',
 '103.27.184.6 · ASN 45899 · VNPT Smart Cloud · Vietnam · Aislamiento fallido 3 veces + MFA deshabilitado', 'sha256:1c8e…4d7a',
 '103.27.184.6', 'Vietnam', 'VN', 'ASN 45899 · VNPT Smart Cloud', TRUE, FALSE, 'success', 'password', 3,
 '{"event_id": "EVT-20261004-88191", "client_ip": "103.27.184.6", "asn_org": "ASN 45899 · VNPT Smart Cloud", "risk_score": 0.91, "unit": "Quirófano", "session_id": "b91e-77d0-4c2f", "mfa": "not_enrolled", "heuristics": ["aislamiento_previo_fallido >= 3", "UNIT_CRITICAL_GUARD"]}'::jsonb),

-- Eventos de enf.mendoza (INC-2026-0415)
(12, 'EVT-20261004-88161', 4, 'enf.mendoza', NOW() - INTERVAL '3 hours', '13:20:41',
 'crit', 'unlock', 'ANOMALÍA', 'Desplazamiento geográfico físicamente imposible',
 '181.60.72.14 · ASN 26459 · Cable Panamá · Panamá · Imposible de viaje (desplazamiento físico inconsistente)', 'sha256:1c8e…4d7a',
 '181.60.72.14', 'Panamá', 'PA', 'ASN 26459 · Cable Panamá', FALSE, FALSE, 'success', 'mfa', 0,
 '{"event_id": "EVT-20261004-88161", "client_ip": "181.60.72.14", "asn_org": "ASN 26459 · Cable Panamá", "risk_score": 0.61, "unit": "Urgencias", "session_id": "d220-5fa3-11c7", "mfa": "enrolled", "heuristics": ["geovelocidad > 900 km/h entre dos sesiones activas", "UNIT_CRITICAL_GUARD"]}'::jsonb),

-- Eventos de lab.tech (INC-2026-0414)
(13, 'EVT-20261004-88155', 5, 'lab.tech', NOW() - INTERVAL '4 hours', '12:58:41',
 'crit', 'unlock', 'ANOMALÍA', 'Dos sesiones simultáneas en países distintos',
 '88.26.244.19 · ASN 12956 · Telefónica · España · Geovelocidad anómala entre dos sesiones activas', 'sha256:1c8e…4d7a',
 '88.26.244.19', 'España', 'ES', 'ASN 12956 · Telefónica', FALSE, FALSE, 'success', 'mfa', 0,
 '{"event_id": "EVT-20261004-88155", "client_ip": "88.26.244.19", "asn_org": "ASN 12956 · Telefónica", "risk_score": 0.55, "unit": "Laboratorio", "session_id": "88be-31fa-0d4c", "mfa": "enrolled", "heuristics": ["geovelocidad > 700 km/h entre dos sesiones activas"]}'::jsonb),

-- Eventos en ventana de 7 días (hace 4 días)
(14, 'EVT-20260930-75210', 1, 'mg.ramirez', NOW() - INTERVAL '4 days', 'hace 4 d',
 'ok', 'globe', 'CONTEXTO', 'Excepción de whitelist validada en pasarela de telemedicina',
 '181.60.72.19 · Panamá · regla WL-03 aplicada sin elevar alerta', NULL,
 '181.60.72.19', 'Panamá', 'PA', 'ASN 26459 · Cable Panamá', TRUE, FALSE, 'success', 'sso', 0,
 '{"event_id": "EVT-20260930-75210", "client_ip": "181.60.72.19", "country": "PA", "whitelist": true}'::jsonb),

-- Eventos en ventana de 30 días (hace 14 días)
(15, 'EVT-20260920-70112', 1, 'mg.ramirez', NOW() - INTERVAL '14 days', 'hace 14 d',
 'ok', 'check', 'ÉXITO', 'Acceso desde congreso médico en Madrid (Whitelist activa)',
 '88.26.240.12 · España · sesión validada por excepción geográfica temporal', NULL,
 '88.26.240.12', 'España', 'ES', 'ASN 12956 · Telefónica', FALSE, FALSE, 'success', 'mfa', 0,
 '{"event_id": "EVT-20260920-70112", "client_ip": "88.26.240.12", "country": "ES", "note": "Historical retention 180d"}'::jsonb),

-- Eventos en ventana de 180 días (hace 45 días)
(16, 'EVT-20260810-50199', 1, 'mg.ramirez', NOW() - INTERVAL '45 days', 'hace 45 d',
 'fail', 'key', 'FALLO', 'Cambio de contraseña expirada en terminal clínico',
 '190.24.9.14 · Colombia · reintento exitoso posterior', NULL,
 '190.24.9.14', 'Colombia', 'CO', 'ASN 3816 · Colombia Telecomunicaciones', FALSE, FALSE, 'failed', 'password', 1,
 '{"event_id": "EVT-20260810-50199", "client_ip": "190.24.9.14", "country": "CO", "note": "Historical retention 180d"}'::jsonb)
ON CONFLICT (event_id) DO NOTHING;

SELECT setval('auth_events_event_id_seq', (SELECT MAX(event_id) FROM auth_events));

-- 5. ALERTS (5 alertas en ventana de 24h + 1 alerta en 7d + 1 alerta en 30d para probar las ventanas de consulta)
INSERT INTO alerts (
    alert_id, incident_code, event_id, user_id, severity, ui_sev, alert_status,
    model_type, title, description, rule_expression, rule_short,
    ip_address, geo_country, geo_cc, asn, risk_score, display_time, display_at, alert_timestamp,
    tree_verdict, tree_incidence, tree_global_rule, tree_branch, tree_reading
) VALUES
(1, 'INC-2026-0417', 1, 1, 'CRÍTICO', 'critico', 'Abierta',
 'DECISION_TREE', 'Intento de acceso no autorizado',
 'Acceso con credencial comprometida tras ráfaga de fuerza bruta desde nodo Tor en Alemania.',
 'intentos_fallidos_15m > 8 AND ventana_entre_intentos_min < 2 AND pais_origen fuera de whitelist',
 '8 intentos fallidos en 2 min + país fuera de la whitelist',
 '185.220.101.47', 'Alemania', 'DE', 'ASN 60729 · Tor Exit Node Network', 0.94,
 '14:31', '2026-10-04 14:31:09', NOW() - INTERVAL '25 minutes',
 'CREDENCIAL COMPROMETIDA', 'ALTA',
 'intentos > 8   AND   ventana < 2 min   AND   pais ≠ Colombia',
 'Rama izquierda del árbol',
 'El modelo no clasificó la sesión por la IP aislada, sino por la combinación de 14 intentos fallidos concentrados en 90 segundos desde un país no autorizado. El nodo 4 falla en falso porque el acceso se produjo por la API REST de interoperabilidad, que no exige MFA.'),

(2, 'INC-2026-0418', 7, 2, 'CRÍTICO', 'critico', 'Abierta',
 'DECISION_TREE', 'Inicio de sesión con dispositivo no registrado',
 'Inicio de sesión desde ASN europeo reportado con dispositivo nunca visto en cuenta de Urgencias.',
 'asn_proveedor_sospechoso AND dispositivo_nunca_visto AND mfa_no_registrada',
 'Login desde ASN de proveedor + dispositivo nunca visto',
 '45.132.192.10', 'Países Bajos', 'NL', 'ASN 9009 · M247 Europe SRL', 0.88,
 '14:12', '2026-10-04 14:12:41', NOW() - INTERVAL '45 minutes',
 'POSIBLE COMPROMISO DE CREDENCIAL', 'ALTA',
 'asn_abuse   AND   dispositivo_nuevo   AND   mfa_ausente',
 'Rama izquierda, detenida por BR-002 en el nodo 5',
 'Los cuatro nodos predictivos se cumplen, pero el nodo 5 invoca la regla de negocio BR-002: la titular pertenece a Urgencias, unidad clasificada como crítica. El motor no propone aislamiento; propone escalamiento normativo al CISO.'),

(3, 'INC-2026-0416', 11, 3, 'CRÍTICO', 'critico', 'Escalada',
 'DECISION_TREE', 'Escritura en historial clínico con MFA deshabilitada',
 'Cuenta administrativa de Quirófano con MFA desactivada y accesos desde Vietnam.',
 'aislamiento_previo_fallido >= 3 AND mfa_deshabilitada AND escritura_en_historial_clinico',
 'Aislamiento fallido 3 veces + MFA deshabilitado',
 '103.27.184.6', 'Vietnam', 'VN', 'ASN 45899 · VNPT Smart Cloud', 0.91,
 '13:47', '2026-10-04 13:47:26', NOW() - INTERVAL '2 hours',
 'COMPROMISO DE CUENTA ADMINISTRATIVA', 'CRÍTICA',
 'aislamiento_fallido   AND   escritura_clinico   AND   mfa_ausente',
 'Rama izquierda, detenida por BR-002 en el nodo 5',
 'El puntaje más alto del lote no proviene de la geolocalización sino del historial: tres aislamientos previos fracasaron sin que nadie escalara. El nodo 5 detiene el aislamiento por BR-002 (Quirófano) y obliga a la ruta de escalamiento al CISO.'),

(4, 'INC-2026-0415', 12, 4, 'ALERTA', 'media', 'En observación',
 'ISOLATION_FOREST', 'Desplazamiento geográfico físicamente imposible',
 'Viaje imposible detectado por Isolation Forest entre Colombia y Panamá.',
 'geovelocidad > 900 km/h entre dos sesiones activas',
 'Imposible de viaje (desplazamiento físico inconsistente)',
 '181.60.72.14', 'Panamá', 'PA', 'ASN 26459 · Cable Panamá', 0.61,
 '13:20', '2026-10-04 13:20:03', NOW() - INTERVAL '3 hours',
 NULL, NULL, NULL, NULL, NULL),

(5, 'INC-2026-0414', 13, 5, 'ALERTA', 'media', 'En observación',
 'ISOLATION_FOREST', 'Dos sesiones simultáneas en países distintos',
 'Sesiones simultáneas en Colombia y España para técnica de laboratorio.',
 'geovelocidad > 700 km/h entre dos sesiones activas',
 'Geovelocidad anómala entre dos sesiones activas',
 '88.26.244.19', 'España', 'ES', 'ASN 12956 · Telefónica', 0.55,
 '12:58', '2026-10-04 12:58:55', NOW() - INTERVAL '4 hours',
 NULL, NULL, NULL, NULL, NULL),

-- Alerta histórica de hace 4 días (visible en ventana de 7d y 30d, excluida en 24h)
(6, 'INC-2026-0402', 14, 1, 'ALERTA', 'media', 'En observación',
 'ISOLATION_FOREST', 'Sesión transfronteriza en pasarela de telemedicina',
 'Alerta en ventana de 7 días fuera de las 24 horas por defecto.',
 'geovelocidad > 650 km/h en enlace regional',
 'Telemedicina regional Panamá (hace 4 días)',
 '181.60.72.19', 'Panamá', 'PA', 'ASN 26459 · Cable Panamá', 0.58,
 '11:20', '2026-09-30 11:20:00', NOW() - INTERVAL '4 days',
 NULL, NULL, NULL, NULL, NULL),

-- Alerta histórica de hace 10 días (visible en ventana de 30d, excluida en 24h y 7d)
(7, 'INC-2026-0390', 15, 1, 'ALERTA', 'media', 'Cerrada',
 'ISOLATION_FOREST', 'Conexión internacional validada por congreso médico',
 'Alerta histórica fuera de la ventana por defecto de 24 horas.',
 'geovelocidad > 700 km/h entre dos sesiones activas',
 'Conexión histórica desde España (archivada)',
 '88.26.240.12', 'España', 'ES', 'ASN 12956 · Telefónica', 0.52,
 '09:15', '2026-09-20 09:15:00', NOW() - INTERVAL '10 days',
 NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (alert_id) DO NOTHING;

SELECT setval('alerts_alert_id_seq', (SELECT MAX(alert_id) FROM alerts));

-- 6. DECISION_PATHS (Nodos explicables de Caja Blanca - FR-004)
INSERT INTO decision_paths (
    alert_id, node_index, node_id, node_name, split_feature, split_condition,
    split_value, observed_value, node_outcome, ui_verdict, is_leaf, leaf_class, rule_explanation, confidence
) VALUES
-- Árbol de INC-2026-0417 (alert_id = 1)
(1, 1, 'node_01', 'Frecuencia de fallos', 'intentos_fallidos_15m', '>', '8', '14', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'intentos_fallidos_15m > 8', 0.96),
(1, 2, 'node_02', 'Ventana entre intentos', 'ventana_entre_intentos_min', '<', '2', '1.4 min', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'ventana_entre_intentos_min < 2', 0.95),
(1, 3, 'node_03', 'Validación geográfica', 'pais_origen', '≠', 'whitelist_usuario', 'Alemania ≠ Colombia', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'pais_origen ≠ whitelist_usuario', 0.98),
(1, 4, 'node_04', 'Estado MFA en sesión', 'mfa_activo', '==', 'true', 'false — bypass por API REST', 'FALSO', 'false', FALSE, 'SUSPICIOUS', 'mfa_activo == true', 0.91),
(1, 5, 'node_05', 'Guardia de unidad crítica', 'usuario_unidad_critica?', '==', 'false', 'false — no está en UCI ni Quirófano', 'COMPROBACIÓN', 'verify', TRUE, 'ANOMALOUS', 'usuario_unidad_critica?', 1.00),

-- Árbol de INC-2026-0418 (alert_id = 2)
(2, 1, 'node_01', 'Reputación ASN', 'asn_origen', '∈', 'feed_abuse_conocido', 'ASN 9009 · 3 nodos reportados', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'asn_origen ∈ feed_abuse_conocido', 0.92),
(2, 2, 'node_02', 'Huella de dispositivo', 'dispositivo_nunca_visto', '==', 'true', 'true · fingerprint 4f2a…9c1e', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'dispositivo_nunca_visto', 0.89),
(2, 3, 'node_03', 'Registro MFA', 'mfa_no_registrada', '==', 'true', 'true · methods = [password]', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'mfa_no_registrada', 0.90),
(2, 4, 'node_04', 'Validación geográfica', 'pais_origen', '≠', 'whitelist_usuario', 'Países Bajos ≠ Colombia', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'pais_origen ≠ whitelist_usuario', 0.95),
(2, 5, 'node_05', 'Restricción BR-002', 'unidad_en_lista_critica', '==', 'true', 'true — Urgencias (BR-002)', 'BR-002', 'block', TRUE, 'ANOMALOUS', 'unidad_en_lista_critica', 1.00),

-- Árbol de INC-2026-0416 (alert_id = 3)
(3, 1, 'node_01', 'Historial de aislamiento', 'aislamiento_previo_fallido', '>=', '3', '3 intentos · 01, 02 y 03 oct', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'aislamiento_previo_fallido >= 3', 0.94),
(3, 2, 'node_02', 'Estado MFA titular', 'mfa_habilitada', '==', 'true', 'false — desactivada por el titular', 'FALSO', 'false', FALSE, 'SUSPICIOUS', 'mfa_habilitada', 0.93),
(3, 3, 'node_03', 'Privilegios clínicos', 'privilegios_sobre_recursos_clinicos', '==', 'true', 'true — escritura en HISTORIAL_CLINICO', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'privilegios_sobre_recursos_clinicos', 0.97),
(3, 4, 'node_04', 'Validación geográfica', 'pais_origen', '≠', 'whitelist_institucional', 'Vietnam ≠ Colombia', 'CIERTO', 'true', FALSE, 'ANOMALOUS', 'pais_origen ≠ whitelist_institucional', 0.96),
(3, 5, 'node_05', 'Restricción BR-002', 'unidad_en_lista_critica', '==', 'true', 'true — Quirófano (BR-002)', 'BR-002', 'block', TRUE, 'ANOMALOUS', 'unidad_en_lista_critica', 1.00)
ON CONFLICT (alert_id, node_index) DO NOTHING;

-- 7. WHITELIST_ENTRIES (6 entradas iniciales de Stitch-prototype)
INSERT INTO whitelist_entries (
    whitelist_id, user_id, cidr, country, cc, scope, start_date, end_date, until_label, active, state, reason, created_by, created_by_name
) VALUES
(1, NULL, '190.24.0.0/16', 'Colombia', 'CO', 'Institucional', '2025-01-01', NULL, 'Permanente', TRUE, 'activa', 'Rango asignado al hospital por la UIT', 6, 'Carla M. Restrepo'),
(2, NULL, '10.20.0.0/16', 'Intranet hospitalaria', 'INT', 'Todos los usuarios', '2025-01-01', NULL, 'Permanente', TRUE, 'activa', 'Red interna, nunca expuesta a Internet', 6, 'Carla M. Restrepo'),
(3, 4, '181.60.72.0/22', 'Panamá', 'PA', 'Urgencias · Satélital', '2026-01-01', '2027-03-01', '2027-03-01', TRUE, 'activa', 'Enlace de Disaster Recovery con la UCI móvil', 8, 'Comité de Ciberseguridad'),
(4, 2, '45.132.192.0/24', 'Países Bajos', 'NL', 'Proveedor de videovigilancia', '2025-11-15', '2026-11-15', '2026-11-15', TRUE, 'activa', 'Contrato marco 2025-114 · solo cámaras, no acceso clínico', 6, 'Carla M. Restrepo'),
(5, 3, '103.27.184.0/24', 'Vietnam', 'VN', 'Soporte externo TI', '2026-10-01', '2026-10-12', '2026-10-12', TRUE, 'por vencer', 'Ventana de mantenimiento acordada', 6, 'Carla M. Restrepo'),
(6, 5, '88.26.240.0/20', 'España', 'ES', 'Laboratorio · socio', '2026-01-01', '2026-10-04', '2026-10-04', FALSE, 'expirada', 'Interoperabilidad con el laboratorio de referencia', 8, 'Comité de Ciberseguridad')
ON CONFLICT (whitelist_id) DO NOTHING;

SELECT setval('whitelist_entries_whitelist_id_seq', (SELECT MAX(whitelist_id) FROM whitelist_entries));

-- 8. DETECTION_RULES
INSERT INTO detection_rules (rule_id, rule_name, model_type, rule_condition, severity, active, description) VALUES
(1, 'Brute Force Credential Stuffing + Foreign IP', 'DECISION_TREE', 'intentos_fallidos_15m > 8 AND ventana_entre_intentos_min < 2 AND pais_origen != whitelist', 'CRÍTICO', TRUE, 'Detecta ataques de fuerza bruta seguidos de acceso desde país no autorizado.'),
(2, 'Suspicious ASN + Unregistered Device', 'DECISION_TREE', 'asn_proveedor_sospechoso AND dispositivo_nunca_visto AND mfa_no_registrada', 'CRÍTICO', TRUE, 'Detecta inicios de sesión desde proveedores de hosting/VPN con huella nueva.'),
(3, 'Impossible Travel Geovelocity', 'ISOLATION_FOREST', 'geovelocidad > 700 km/h entre dos sesiones activas', 'ALERTA', TRUE, 'Detecta desplazamientos geográficos físicamente imposibles entre sesiones.')
ON CONFLICT (rule_id) DO NOTHING;

-- 9. AUDIT_LOGS (Registro inicial de arranque normativo)
INSERT INTO audit_logs (actor_username, actor_user_id, action_type, resource_type, resource_id, action_description, details, client_ip, success) VALUES
('carla.restrepo', 6, 'LOGIN', 'USER', 'carla.restrepo', 'Inicio de sesión de Coordinadora SOC en nodo SOC-BOG-01', '{"role": "Coordinador SOC", "tls": "1.3", "normative": "Ley 1581 / HIPAA"}'::jsonb, '10.20.0.5', TRUE);

COMMIT;
