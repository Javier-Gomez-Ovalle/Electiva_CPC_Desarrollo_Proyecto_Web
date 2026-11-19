-- =========================================================================
-- HeraUEBA · database/schema.sql
-- Esquema relacional para monitoreo UEBA en Centros de Operaciones de
-- Seguridad (SOC) del sector salud.
-- Fuente de autoridad: docs/er-diagram.md & MASTER_IMPLEMENTATION_PROMPT.md
-- =========================================================================

BEGIN;

DROP TABLE IF EXISTS detection_rules CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS quarantine_actions CASCADE;
DROP TABLE IF EXISTS whitelist_entries CASCADE;
DROP TABLE IF EXISTS decision_paths CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS auth_events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. ROLES (RBAC - NFR-003)
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(64) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. UNITS (Unidades Clínicas y Exención Crítica BR-002 / FR-007)
CREATE TABLE units (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(64) NOT NULL UNIQUE,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    unit_type VARCHAR(16) NOT NULL CHECK (unit_type IN ('ICU', 'OR', 'ER', 'OTHER')),
    department VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USERS (Titulares de cuentas y Operadores SOC)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    initials VARCHAR(8) NOT NULL DEFAULT 'US',
    job_title VARCHAR(128) NOT NULL DEFAULT 'Personal Clínico',
    institution VARCHAR(128) NOT NULL DEFAULT 'Clínica Central · Sede Universitaria',
    phone VARCHAR(64) NOT NULL DEFAULT '+57 (601) 742-8800',
    avatar_url TEXT,
    floor_location VARCHAR(128) NOT NULL DEFAULT 'Sede Principal',
    shift_schedule VARCHAR(128) NOT NULL DEFAULT 'Diurno',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    tenure VARCHAR(64) NOT NULL DEFAULT '1 año',
    last_legit_desc VARCHAR(255),
    unit_id INTEGER NOT NULL REFERENCES units(unit_id) ON DELETE RESTRICT,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_isolated BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash VARCHAR(255) NOT NULL,
    keycloak_id VARCHAR(128) UNIQUE,
    ad_guid VARCHAR(128) UNIQUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUTH_EVENTS (Telemetría de Autenticación e Ingesta Keycloak + IPinfo)
CREATE TABLE auth_events (
    event_id BIGSERIAL PRIMARY KEY,
    event_code VARCHAR(64) UNIQUE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    username_attempt VARCHAR(64) NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    display_time VARCHAR(32) NOT NULL,
    timeline_kind VARCHAR(16) NOT NULL DEFAULT 'ok' CHECK (timeline_kind IN ('crit', 'fail', 'ok')),
    timeline_icon VARCHAR(32) NOT NULL DEFAULT 'check',
    verdict_label VARCHAR(32) NOT NULL DEFAULT 'ÉXITO',
    title VARCHAR(255) NOT NULL,
    meta_desc TEXT NOT NULL,
    payload_hash VARCHAR(64),
    ip_address VARCHAR(64) NOT NULL,
    geo_country VARCHAR(64) NOT NULL,
    geo_cc VARCHAR(8) NOT NULL DEFAULT 'CO',
    geo_region VARCHAR(64),
    geo_city VARCHAR(64),
    asn VARCHAR(128) NOT NULL,
    isp VARCHAR(128),
    is_vpn BOOLEAN NOT NULL DEFAULT FALSE,
    is_tor BOOLEAN NOT NULL DEFAULT FALSE,
    outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('success', 'failed', 'blocked')),
    auth_method VARCHAR(32) NOT NULL DEFAULT 'password',
    failure_count_window INTEGER NOT NULL DEFAULT 0,
    raw_json JSONB,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ALERTS (Alertas UEBA Priorizadas - FR-001, FR-002)
CREATE TABLE alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    incident_code VARCHAR(32) NOT NULL UNIQUE,
    event_id BIGINT REFERENCES auth_events(event_id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRÍTICO', 'ALERTA', 'SEGURO')),
    ui_sev VARCHAR(16) NOT NULL CHECK (ui_sev IN ('critico', 'media', 'info')),
    alert_status VARCHAR(32) NOT NULL CHECK (alert_status IN ('Abierta', 'En observación', 'Escalada', 'Cerrada', 'Aislada')),
    model_type VARCHAR(32) NOT NULL CHECK (model_type IN ('DECISION_TREE', 'ISOLATION_FOREST', 'HYBRID')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rule_expression TEXT NOT NULL,
    rule_short VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64) NOT NULL,
    geo_country VARCHAR(64) NOT NULL,
    geo_cc VARCHAR(8) NOT NULL,
    asn VARCHAR(128) NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    display_time VARCHAR(16) NOT NULL,
    display_at VARCHAR(32) NOT NULL,
    alert_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tree_verdict VARCHAR(128),
    tree_incidence VARCHAR(32),
    tree_global_rule TEXT,
    tree_branch VARCHAR(255),
    tree_reading TEXT,
    investigated_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    investigated_at TIMESTAMPTZ,
    dismissed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    dismissed_at TIMESTAMPTZ,
    dismissal_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DECISION_PATHS (Explicabilidad Caja Blanca - FR-004, NFR-004)
CREATE TABLE decision_paths (
    path_id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT NOT NULL REFERENCES alerts(alert_id) ON DELETE CASCADE,
    node_index INTEGER NOT NULL,
    node_id VARCHAR(64) NOT NULL,
    node_name VARCHAR(128) NOT NULL,
    split_feature VARCHAR(128) NOT NULL,
    split_condition VARCHAR(64) NOT NULL,
    split_value VARCHAR(128) NOT NULL,
    observed_value VARCHAR(255) NOT NULL,
    node_outcome VARCHAR(32) NOT NULL CHECK (node_outcome IN ('CIERTO', 'FALSO', 'COMPROBACIÓN', 'BR-002')),
    ui_verdict VARCHAR(16) NOT NULL CHECK (ui_verdict IN ('true', 'false', 'verify', 'block')),
    is_leaf BOOLEAN NOT NULL DEFAULT FALSE,
    leaf_class VARCHAR(32) DEFAULT 'ANOMALOUS',
    rule_explanation TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (alert_id, node_index)
);

-- 7. WHITELIST_ENTRIES (Gestión de Excepciones Geográficas - FR-008)
CREATE TABLE whitelist_entries (
    whitelist_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    cidr VARCHAR(64) NOT NULL UNIQUE,
    country VARCHAR(64) NOT NULL,
    cc VARCHAR(8) NOT NULL,
    region VARCHAR(64),
    city VARCHAR(64),
    scope VARCHAR(128) NOT NULL DEFAULT 'Institucional',
    asn VARCHAR(64),
    ip_range_start VARCHAR(64),
    ip_range_end VARCHAR(64),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    until_label VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    state VARCHAR(32) NOT NULL DEFAULT 'activa' CHECK (state IN ('activa', 'por vencer', 'expirada')),
    reason TEXT NOT NULL,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_by_name VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. QUARANTINE_ACTIONS (Aislamiento Simulado en 2 Pasos - FR-005, FR-006, FR-007, BR-001, BR-002)
CREATE TABLE quarantine_actions (
    action_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alert_id BIGINT REFERENCES alerts(alert_id) ON DELETE SET NULL,
    action_status VARCHAR(32) NOT NULL CHECK (action_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED')),
    reason TEXT NOT NULL,
    requested_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    two_step_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    two_step_confirmed_at TIMESTAMPTZ,
    blocked_due_to_critical_unit BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason TEXT,
    simulated BOOLEAN NOT NULL DEFAULT TRUE,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT_LOGS (Trazabilidad Normativa Ley 1581 / HIPAA - NFR-004)
CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    actor_username VARCHAR(64) NOT NULL,
    actor_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action_type VARCHAR(32) NOT NULL CHECK (action_type IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT')),
    resource_type VARCHAR(32) NOT NULL CHECK (resource_type IN ('USER', 'ALERT', 'WHITELIST', 'QUARANTINE', 'DECISION_PATH')),
    resource_id VARCHAR(64) NOT NULL,
    action_description TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_ip VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
    user_agent VARCHAR(255) DEFAULT 'HeraUEBA-Client/1.0',
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. DETECTION_RULES (Catálogo de Reglas Analíticas)
CREATE TABLE detection_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(128) NOT NULL UNIQUE,
    model_type VARCHAR(32) NOT NULL CHECK (model_type IN ('DECISION_TREE', 'ISOLATION_FOREST', 'HYBRID')),
    rule_condition TEXT NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRÍTICO', 'ALERTA', 'SEGURO')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES DE OPTIMIZACIÓN PARA CONSULTAS SOC
CREATE INDEX idx_alerts_window_sev ON alerts(alert_timestamp DESC, severity, alert_status);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_incident_code ON alerts(incident_code);
CREATE INDEX idx_auth_events_ts_user ON auth_events(event_timestamp DESC, user_id);
CREATE INDEX idx_decision_paths_alert_order ON decision_paths(alert_id, node_index ASC);
CREATE INDEX idx_whitelist_active_dates ON whitelist_entries(active, start_date, end_date);
CREATE INDEX idx_quarantine_user_status ON quarantine_actions(user_id, action_status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;
