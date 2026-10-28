# MASTER IMPLEMENTATION PROMPT — HERAUEBA MVP
> Version: 1.1 (MVP Implementation, Clinical Safety & Complete Views Baseline) · Generated: 2026-10-26 · Basis: repository state at branch `stitch/prototype` (commit `8f815db`)
> Audience: a coding agent with access to this repository.
> This document is self-contained. It is not a summary of the project; it is the
> instruction set for building it.
---
## 1. YOUR ROLE
You are the implementation engineer for HeraUEBA (Sistema de Monitoreo Analítico del Comportamiento de Usuarios y Entidades para el Sector Salud). You will build a production-shaped MVP: Web Application (FastAPI REST API + PostgreSQL 16/17 + Frontend desacoplado o integrado en interfaz reactiva de baja densidad cognitiva), deployed with Docker Compose, preserving the exact visual, structural, and behavioral design of the existing Stitch prototype in `Stitch-prototype/` while elevating prototype-only shortcuts into complete application views.
Operating rules for your role:
- You implement; you do not re-analyze the project from zero. The analysis is done.
- You do not invent requirements, fields, algorithms, thresholds, roles, or screens. When something is missing, you follow §20 (pending decisions).
- You never claim a feature works because the UI renders. A feature is done when the test named for it in §16 passes against real services and database.
- You never replace a real service with a simulation in backend code, except where the MVP scope explicitly dictates local database simulation (e.g., BR-001 simulated account isolation vs. live Keycloak token revocation).
- You work in small increments with verification between them (§15).
---
## 2. PROJECT CONTEXT
HeraUEBA is designed for hospital Security Operations Centers (SOC). In healthcare institutions, account takeover (MITRE ATT&CK T1078) represents an existential threat to Protected Health Information (PHI) and clinical continuity. Today, SOC analysts manually triage SIEM alerts across disjointed logs, taking 2 to 4 hours per incident, overwhelmed by false positives caused by medical staff traveling to conferences or connecting via external networks/VPNs.
Crucially, an erroneous account lockout on a surgeon in an operating theater or a doctor in the ICU creates direct life-safety hazards and institutional liability. HeraUEBA centralizes: real-time streaming of authentication events (Keycloak SSO/Active Directory data), hybrid analytical AI models (Decision Trees for brute-force credential stuffing and Isolation Forest for impossible travel), normative white-box explainability (Law 1581 of 2012 / HIPAA), geographic whitelist management, and safety-friction mitigation (two-step account isolation with strict clinical unit exemptions).
Users and their worlds:
| Role | Sub-level / ID | What they do |
|---|---|---|
| Coordinador SOC | `role_id = 2` (`coordinador`) | Administrative and resolutive operator (`carla.restrepo@hospital.local`). Triages critical alerts; evaluates white-box decision logic; executes two-step simulated account isolation (`FR-005`, `FR-006`); manages geographical exceptions (whitelists, `FR-008`); escalates to CISO. |
| Analista SOC (Junior) | `role_id = 3` (`junior`) | First-line monitor during 12-hour shifts (`diego.fuentes@hospital.local`). Evaluates top-of-viewport Critical Alerts without vertical scroll; filters events; inspects raw payloads and decision paths; copies incident evidence. **Strictly forbidden from isolating accounts or mutating whitelists (`NFR-003`)**. |
| Analista SOC (Senior) | `role_id = 5` (`senior`) | Second-line forensic investigator (`valeria.soto@hospital.local`). Performs deep 180-day historical queries (`FR-003`), correlates multi-window anomalies, prepares STIX 2.1 packages, and escalates incidents to the Coordinator/CISO. **Strictly forbidden from executing account isolation without Coordinator credentials (`NFR-003`)**. |
| CISO / Director TI | `role_id = 1` (`ciso`) | Executive sponsor. Defines clinical cybersecurity policies; reviews incident escalations (`BR-002`); audits regulatory compliance and algorithmic decision trails. |
Language: **all user-facing copy is Spanish (Colombia)**, using the exact state names, severity labels, and tokens established in `Stitch-prototype/DESIGN.md`. Code identifiers, schemas, and API routes are English (`camelCase` in TypeScript/JS, `snake_case` in Python backend). Database objects use standard `snake_case` (matching `docs/er-diagram.md`).
Deployment target: Single Docker Compose stack (Reverse proxy / Caddy or Nginx, Backend API, PostgreSQL database, and Frontend web client), persistent volumes for database data and logs. The browser communicates over a single origin.
---
## 3. PROBLEM, OBJECTIVES AND SCOPE
### 3.1 Problem
Manual tabulation and investigation of authentication logs; alert fatigue caused by VPNs and legitimate medical travel; black-box AI models unsuited for medical/legal audit; catastrophic clinical risk if automated algorithms interrupt active surgeons or ICU staff.
### 3.2 Objectives (from `docs/srs_heraueba.md` and `README.md`)
1. Reduce Mean Time to Remediate (MTTR) by at least 70% (from 2–4 hours down to < 45 minutes).
2. Deliver a low-cognitive-density UI where critical red alerts are triaged within the primary viewport without scroll.
3. Guarantee 100% white-box explainability for algorithmic classifications (Ley 1581 de 2012 and HIPAA compliance).
4. Strictly enforce zero automated lockouts (BR-001) and clinical unit lockout exemptions (BR-002).
5. Segregate duties strictly through RBAC (Coordinador SOC vs. Analista SOC Junior / Senior).
### 3.3 In scope (MVP)
- **P0**:
  - Dedicated **Login View (`#/login`)** supporting authentication as **Coordinador SOC** and **Analista SOC (Junior / Senior)**, removing the prototype-only role switcher from the left rail.
  - Ingestion and serving of enriched authentication events (RBA dataset enriched with IPinfo); dashboard with interactive temporal window chips (`1 h`, `24 h` default, `7 d`, `30 d`) that genuinely filter system alerts and KPIs (`FR-002`); immediate critical alert viewport triage (`FR-001`) with a dynamic filter button that toggles text between `"Revisar las X críticas"` and `"Ver todas las alertas (Y)"`.
  - White-box decision tree explainability panel (`FR-004`).
  - Full standalone view (`#/aislamiento`) and modal for simulated two-step account isolation with typing friction (`FR-005`, `FR-006`).
  - Full standalone view (`#/error-unidad-critica`) and modal for hard clinical unit restriction blocking lockouts on ICU, OR, and ER (`FR-007`, `BR-002`).
  - RBAC backend guards preventing Junior/Senior analysts from isolating accounts (`HTTP 403`).
  - Full audit log trail in PostgreSQL (`NFR-004`).
- **P1**:
  - Geographic whitelist management (`#/whitelist` CRUD with CIDR/country, mandatory validity date, clinical justification, and audit checkbox; `FR-008`).
  - Interactive historical user investigation (`#/historial`) filtering across full 180-day data lake retention by time window (`24h`, `7d`, `30d`, `full`), authentication type (`password`, `mfa`, `sso`), and result (`all`, `fail`, `ok`, `crit`) (`FR-003`).
  - Native **Traceability Matrix View (`#/trazabilidad`)** mapping `FR-001`–`FR-008`, `NFR-001`–`NFR-004`, and `BR-001`–`BR-002` to user stories, views, API endpoints, and automated tests (replacing the prototype's raw markdown link and eliminating the "Prompts de Stitch" link).
  - Operator **Profile Hover Menu** in the left rail (with options **Configurar cuenta** and **Cerrar sesión**) and a complete **Account Configuration View (`#/perfil`)** allowing operators to view and update their profile photo (upload or URL), full name, institution/company, email, phone, and shift schedule.
  - STIX 2.1 / JSON incident export payloads; notification and CISO escalation hooks.
- **P2 / post-MVP**: Real Keycloak Admin REST API integration for automated token revocation; real-time Kafka/Webhook event streaming; Active Directory dynamic LDAP synchronization; multi-tenant hospital federation.
### 3.4 Explicitly out of scope
- Autonomous account blocking triggered directly by AI thresholds (strictly forbidden by BR-001).
- Hard lockouts on ICU, OR, or Emergency personnel without administrative/clinical director bypass outside the platform (forbidden by BR-002).
- Prototype artifacts in the navigation rail: the left-rail role/view selector ("Simular rol") and the "Prompts de Stitch" view are excluded from the application UI.
- Decorative charts, pie charts, sparklines, or complex canvas graphs (violates low-cognitive-density mandate).
- Modifications to the frozen agent framework (`core/`, `agents/`, `skills/`, `interfaces/`, `tools/`).
---
## 4. SOURCES AND VERIFIED PATHS
Read these before writing code. Paths are real and verified in this repository:
| Path | What it gives you | Authority |
|---|---|---|
| `README.md` | Master project charter, problem statement, business processes BP-001 to BP-003, requirements summary. | High-level authority |
| `docs/srs_heraueba.md` | Complete Software Requirements Specification: FR-001–FR-008, NFR-001–NFR-004, BR-001–BR-002, traceability matrix, quality review. | Highest requirements authority |
| `docs/historias_usuario.md` | User stories US-001–US-006, Gherkin acceptance criteria, non-functional validation scenario Valid-001. | Behavior and testing authority |
| `docs/er-diagram.md` & `.mmd` | Complete physical database schema: core tables (`ROLES`, `UNITS`, `USERS`, `AUTH_EVENTS`, `ALERTS`, `DECISION_PATHS`, `WHITELIST_ENTRIES`, `QUARANTINE_ACTIONS`, `AUDIT_LOGS`). | Database authority |
| `docs/class-diagram.md` & `.mmd` | Class model showing framework interaction and domain entities. | Structural support |
| `docs/components.md` & `.drawio` | Architectural component topology, data flow, and subsystems. | Architecture authority |
| `docs/transcripcion.md` | Discovery interview transcript with hospital CISO, containing qualitative operational constraints. | Contextual authority |
| `Stitch-prototype/DESIGN.md` | Master clinical design system: palette, typography, WCAG 2.2 contrast rules, spacing, and strict UX principles. | Highest visual authority |
| `Stitch-prototype/tokens.css` | Exact CSS custom properties (hex tokens, radii, shadows, typography). | Visual token authority |
| `Stitch-prototype/prototype/index.html` | Base SPA shell (rail, topbar, toast root, modal root). | Layout authority |
| `Stitch-prototype/prototype/assets/data.js` | Reference demo datasets: users, critical units, alerts, white-box decision trees, whitelist entries. | Seed & fixtures authority |
| `Stitch-prototype/prototype/assets/views.js` | Base layout markup for Dashboard, Alert Detail, Whitelist, and History. | UI markup reference |
| `Stitch-prototype/prototype/assets/modals.js` | Modal implementations: 2-step isolation, critical unit denial (BR-002), confirmations. | Interaction contract |
| `Stitch-prototype/prototype/assets/app.js` | Reference business logic, state management, hash routing, input validation. | Behavioral reference |
| `Stitch-prototype/verificar.js` | Automated Puppeteer verification suite testing behavioral and presentation invariants. | Quality benchmark |
| `Stitch-prototype/docs/01-analisis-color.md` | Color contrast audit and token derivation details. | Design rationale |
| `Stitch-prototype/docs/03-trazabilidad.md` | Verification matrix linking requirements to UI assets. | Traceability authority |
Directories `core/`, `agents/`, `skills/`, `interfaces/`, `config/`, `tools/`, `evaluations/` represent the external multi-agent scaffolding. Do not alter their structure or import business logic directly into them.
---
## 5. FUNCTIONAL AND NON-FUNCTIONAL REQUIREMENTS
### 5.1 Functional requirements (8)
| ID | Requirement (condensed) | Roles | Pri | Prototype | MVP Tier |
|---|---|---|---|---|---|
| FR-001 | Visualización Priorizada de Alertas Rojas: red alerts rendered at the top of the viewport without vertical scroll; dynamic toggle button switches text when filtering critical alerts. | Analista (Junior/Senior), Coordinador SOC | Alta | UI + API | P0 |
| FR-002 | Filtro Temporal Interactivo (24 horas por defecto): default query window loads last 24h of telemetry; switching between `1 h`, `24 h`, `7 d`, and `30 d` dynamically filters alerts and recalculates KPIs. | Analista (Junior/Senior), Coordinador SOC | Alta | UI + API | P0 |
| FR-003 | Filtro Histórico por Usuario: interactive search and filter of events across full 180-day forensic retention by time window (`24h`, `7d`, `30d`, `full`), auth type, and outcome. | Analista (Junior/Senior), Coordinador SOC | Media | UI + API | P1 |
| FR-004 | Explicabilidad del Modelo (Caja Blanca): human-readable decision tree path showing nodes, observed conditions, and thresholds. | Analista (Junior/Senior), Coordinador SOC | Alta | UI + API | P0 |
| FR-005 | Interfaz de Aislamiento Simulado: dedicated button and full standalone view (`#/aislamiento`) to initiate account quarantine workflow. | Coordinador SOC | Alta | UI + API | P0 |
| FR-006 | Verificación de Dos Pasos para Aislamiento: step 1 reason (≥ 30 chars) & re-auth password, step 2 literal confirmation typing (`AISLAR`). | Coordinador SOC | Alta | UI + API | P0 |
| FR-007 | Restricción de Bloqueo por Unidad Crítica: hard block and full standalone view (`#/error-unidad-critica`) denying isolation of ICU, OR, and ER staff. | All roles (system-enforced) | Alta | UI + API | P0 |
| FR-008 | Gestión de Whitelist Geográfica: CRUD of network CIDRs, countries, validity dates, and clinical reasons. | Coordinador SOC | Alta | UI + API | P1 |
### 5.2 Non-functional requirements (4)
| ID | Requirement | Target Metric | Verification Method |
|---|---|---|---|
| NFR-001 | Eficiencia y Tiempo de Respuesta (MTTR) | 70% reduction (< 45 minutes triage time) | End-to-end journey audit; automated flow test |
| NFR-002 | Usabilidad de Baja Densidad Cognitiva | Zero decorative charts; max 1 primary action per screen; critical alerts within first 900px vertical | Automated fold height assertion; DOM element counter |
| NFR-003 | Control de Acceso Basado en Roles (RBAC) | Analista (Junior/Senior) blocked from isolation endpoint (HTTP 403) and UI disabled; login supports Coordinador and Analista (Junior/Senior) | Unit and integration tests; UI state audit |
| NFR-004 | Trazabilidad y Cumplimiento Normativo (Ley 1581 / HIPAA) | Every decision path persisted and every isolation/whitelist/profile mutation logged with actor/timestamp; interactive Traceability Matrix view (`#/trazabilidad`) | Relational integrity and audit table assertions |
---
## 6. ACTORS, USER STORIES AND USE CASES
### 6.1 Actors
- **Coordinador SOC** (`carla.restrepo@hospital.local`) — Full operational & mitigation authority.
- **Analista SOC**:
  - **Analista Junior SOC** (`diego.fuentes@hospital.local`) — First-line monitoring, triage, and read-only explainability.
  - **Analista Senior SOC** (`valeria.soto@hospital.local`) — Second-line forensic investigation (`180d`), correlation, and escalation without direct account isolation privileges.
- **CISO** (`ciso@hospital.local`) — Policy definition and escalation recipient.
### 6.2 User Stories (`docs/historias_usuario.md`)
- **US-001**: Priority view of red alerts without scroll and dynamic critical filter button (FR-001, NFR-002).
- **US-002**: 24-hour default time window and interactive temporal window queries (`1h`, `24h`, `7d`, `30d`) (FR-002).
- **US-003**: Forensic historical user search across retention store with interactive filters (FR-003).
- **US-004**: Algorithmic decision explainability panel (caja blanca) (FR-004, NFR-004).
- **US-005**: Safe two-step account isolation with critical unit protection in both full views and modals (FR-005, FR-006, FR-007, BR-001, BR-002, NFR-003).
- **US-006**: Geographic exceptions management (Whitelist) (FR-008).
### 6.3 Core Use Cases to Implement
- **UC-0 (Role Authentication & Profile Management)**: Operator signs in at `#/login` selecting **Coordinador SOC**, **Analista Junior SOC**, or **Analista Senior SOC** → session established → hovering over the profile card in the left rail opens a popup box with **Configurar cuenta** (`#/perfil`) and **Cerrar sesión** → in `#/perfil`, the operator updates profile image, name, institution/company, email, and phone, persisted via `PUT /api/v1/auth/profile`.
- **UC-1 (Real-time Triage & Interactive Windows)**: Analyst loads dashboard → system presents top red alerts (< 24h) → clicking the critical filter button toggles between `"Revisar las X críticas"` and `"Ver todas las alertas (Y)"` → clicking time window chips (`1 h`, `24 h`, `7 d`, `30 d`) dynamically updates the alert queue and KPIs.
- **UC-2 (Coordinator 2-Step Isolation)**: Coordinator navigates to `#/aislamiento` (or clicks "Aislar usuario" on an alert) → selects non-critical account → completes Step 1 (justification ≥ 30 chars, password re-auth) → completes Step 2 (types `AISLAR`) → account state changes to `AISLADA` in database → audit record created.
- **UC-3 (Critical Unit Denial — BR-002)**: Operator opens `#/error-unidad-critica` (or attempts isolation on personnel assigned to ICU/OR/ER) → system denies action with `BR-002` view/modal → offers alternative pathways (session-only revocation, CISO escalation) with at most 1 primary button.
- **UC-4 (Analyst Role Enforcement)**: Junior or Senior Analyst inspects critical alert or `#/aislamiento` → isolation execution is disabled with explicit RBAC explanation → API endpoint denies direct POST with HTTP 403.
- **UC-5 (Whitelist Exemption)**: Coordinator adds CIDR/country exception with required end date and medical justification → record saved to database → audit log created.
- **UC-6 (Traceability Matrix & Incident Export)**: Operator opens `#/trazabilidad` to audit normative coverage (`FR`, `NFR`, `BR`) or clicks "Exportar" to generate a structured STIX 2.1 / JSON forensic package.
---
## 7. BUSINESS RULES AND ACCEPTANCE CRITERIA
### 7.1 Business rules (normative)
| ID | Rule | Description |
|---|---|---|
| BR-001 | Cero Tolerancia a Bloqueos Automáticos | No AI algorithm can autonomously execute an account lockout. The system threshold is parameterized at `umbral_auto_bloqueo = 0.98`. Since max dataset score is 0.94, every mitigation strictly mandates human intervention. |
| BR-002 | Exención de Unidades Críticas | Personnel assigned to vital support units (`UCI`, `Quirófano`, `Urgencias`) are strictly exempt from operational account lockouts. Software lockouts are rejected without exception or bypass. |
### 7.2 Canonical enumerations — use these exact strings
```
severidad:          CRÍTICO · ALERTA · SEGURO
estado_alerta:      Abierta · En observación · Escalada · Cerrada · Aislada
unidades_criticas:  UCI · Quirófano · Urgencias
roles:              Coordinador SOC · Analista Junior SOC · Analista Senior SOC · CISO
estado_whitelist:   activa · por vencer · expirada
veredicto_nodo:     CIERTO · FALSO · COMPROBACIÓN · BR-002
accion_cuarentena:  PENDING · APPROVED · REJECTED · EXECUTED · CANCELLED
```
---
## 8. PROTOTYPE CORRECTIONS AND PRODUCTION TARGET
Corrections applied over the initial Stitch prototype (`Stitch-prototype/`):
1. **Login View (`#/login`)**: Added full SSO/Active Directory authentication view for **Coordinador SOC** and **Analista SOC (Junior y Senior)**.
2. **Removed Left-Rail Prototype Role Switcher**: Eliminated the visible "Simular rol" segmented control from the left navigation rail (used only during early prototyping; role changes occur through authentication/session management).
3. **Dynamic Critical Filter Button Text**: Clicking `[data-action="only-critical"]` on the Dashboard critical banner dynamically toggles the button label between `"Revisar las X críticas"` (when showing all) and `"Ver todas las alertas (Y)"` (when filtering only critical alerts), alongside `aria-pressed`.
4. **Interactive Query Windows & Filters**: Time window buttons (`1 h`, `24 h`, `7 d`, `30 d` on `#/dashboard` and `24h`, `7d`, `30d`, `full` + `type` + `result` on `#/historial`) actively query and filter the underlying alerts, KPI metrics, and forensic events rather than acting as static decorations.
5. **Full View for 2-Step Isolation (`#/aislamiento`)**: Dedicated full-page workspace for the 2-step isolation workflow (`FR-005`, `FR-006`) with account selector, Step 1 (justification + domain re-auth) and Step 2 (`AISLAR` friction bar), plus live white-box context.
6. **Full View for Critical Unit Error (`#/error-unidad-critica`)**: Dedicated full-page screen for `BR-002` / `FR-007` critical unit lockout restriction (`UCI`, `Quirófano`, `Urgencias`), displaying the protected unit's clinical risk, normative white-box tree stopped at node 5, and safe alternative actions (revoke suspicious session only or escalate to CISO).
7. **Removed "Prompts de Stitch"**: Removed the prototype-only `Prompts de Stitch` link from the left rail.
8. **Native Traceability Matrix View (`#/trazabilidad`)**: Built a complete in-app view displaying the normative traceability matrix (`FR-001`–`FR-008`, `NFR-001`–`NFR-004`, `BR-001`–`BR-002`), interactive requirement links, and test verification status.
9. **Profile Hover Menu**: Hovering or focusing the operator profile block in the bottom-left rail (`.profile-wrap`) reveals an options popover (`.profile-menu`) with **Configurar cuenta** (`#/perfil`) and **Cerrar sesión** (`data-action="logout"`).
10. **Account Configuration View (`#/perfil`)**: Full view allowing the authenticated operator to view and update their profile picture (local image upload via `FileReader` or URL), full name, institution/company, email, phone number, and shift schedule, persisted in PostgreSQL via `PUT /api/v1/auth/profile`.
---
## 9. VIEWS, COMPONENTS AND BEHAVIORS TO PRESERVE
### 9.1 Logical Views
1. **Inicio de Sesión (`#/login`)**:
   - Role selector cards for **Coordinador SOC**, **Analista Junior SOC**, and **Analista Senior SOC**.
   - Pre-fills institutional email (`@hospital.local`) upon selecting a role; validates password and establishes authenticated session (`POST /api/v1/auth/login`).
2. **Dashboard Principal (`#/dashboard`)**:
   - KPIs: Alertas críticas, Alertas medias, Cuentas aisladas, Inicios de sesión (dynamically recalculated according to the active time window).
   - Interactive time window filter chips: `1 h`, `24 h` (default active), `7 d`, `30 d`.
   - Secondary filters: Risk level, Department/Unit, Country.
   - Primary Critical Alert Banner & Card: Rendered before scroll (bottom bounding box < 900px viewport). Filter button dynamically changes text on click (`"Revisar las X críticas"` ↔ `"Ver todas las alertas (Y)"`).
   - Secondary Analysis Queue: Rendered below the fold.
3. **Detalle de Alerta (`#/alerta/:id`)**:
   - Breadcrumbs, severity badges, risk score (`tabular-nums`).
   - Sticky Right Column: White-Box Decision Tree Panel (`#whitebox`) displaying step-by-step nodes with logic badges.
   - Mitigation Bar: Primary destructive button "Aislar usuario" (disabled for Junior and Senior Analyst roles), "Escalar al CISO", "Copiar incidente".
   - Subject Identity Card & Forensic Event Timeline.
4. **Gestión de Whitelist (`#/whitelist`)**:
   - Split view: Configured whitelist entries table (left) + Add entry form (right sticky).
   - Form validation: IPv4 CIDR regex (`190.24.0.0/16`), mandatory expiration date, clinical note ≥ 15 chars, audit confirmation checkbox.
5. **Historial de Usuario (`#/historial?u=:user`)**:
   - Account switcher chips + interactive forensic filters: window (`24h`, `7d`, `30d`, `full`), authentication type (`all`, `password`, `mfa`, `sso`), and outcome (`all`, `fail`, `ok`, `crit`).
   - Notice of forensic scope (180-day retention bypasses 24h dashboard filter).
   - Historical event timeline with raw JSON payload inspection.
6. **Vista Completa de Aislamiento en 2 Pasos (`#/aislamiento`)**:
   - Target account selector for non-critical units (`mg.ramirez`, `enf.mendoza`, `lab.pardo`).
   - Complete 2-step workflow (`Paso 1 de 2: Justificación y re-autenticación` → `Paso 2 de 2: Confirmación literal "AISLAR"`) alongside subject identity and white-box summary.
7. **Vista Completa de Error por Unidad Crítica (`#/error-unidad-critica`)**:
   - Critical unit account selector (`enf.castillo` · Urgencias, `adm.sistema` · Quirófano, `dr.vargas` · UCI).
   - Full `BR-002` clinical safety restriction details, alternative non-disruptive mitigation actions, and white-box decision path stopped at node 5.
8. **Matriz de Trazabilidad (`#/trazabilidad`)**:
   - Summary KPIs (`8/8 FR`, `4/4 NFR`, `2/2 BR`, `8/8 Tests`) and complete normative table linking each requirement ID to its user story, SPA view route, FastAPI endpoint, and automated test.
9. **Configuración de Cuenta (`#/perfil`)**:
   - Accessible from the left-rail profile hover menu (`.profile-menu`).
   - Displays current operator avatar/initials, role badge, and form to upload/update profile image, full name, institution/company, institutional email, phone, and shift schedule.
---
## 10. VISUAL DESIGN AND UI CONVENTIONS
Source of truth: `Stitch-prototype/DESIGN.md` and `tokens.css`.
### 10.1 Palette (Strict Tokens)
```css
/* Primarios */
--primary: #0F4C81;           /* Botones primarios, enlaces */
--primary-hover: #0B3A63;     
--primary-container: #E3ECF5; /* Fondos badges informativos */
--on-primary: #FFFFFF;
/* Superficies y Neutros */
--background: #F5F7FA;        /* Fondo general */
--surface: #FFFFFF;           /* Tarjetas, modales, tablas */
--on-surface: #1A202C;        /* Texto principal */
--on-surface-variant: #4A5568;/* Texto secundario */
--on-surface-muted: #5F6B7D;  /* Metadatos terciarios (5.40:1 sobre blanco) */
--outline: #E2E8F0;           /* Bordes decorativos */
--outline-strong: #8A94A6;    /* Bordes de inputs y botones (3:1 no-textual) */
/* Semántica de Severidad (Relleno oscuro para texto blanco >= 4.5:1) */
--error: #C53030;             /* Relleno botón destructivo y badge crítico */
--error-indicator: #E53E3E;   /* Franja lateral, iconos, bordes NO textuales */
--error-container: #FFF5F5;   /* Fondo fila crítica */
--on-error-container: #9B2C2C;/* Texto sobre fondo rojo claro */
--warning: #B45309;           /* Relleno badge alerta media */
--warning-indicator: #DD6B20; /* Iconos y puntos ámbar */
--warning-container: #FFF4E8; 
--on-warning-container: #9C4221;
--success: #2C7A4B;           /* Relleno badge seguro / éxito */
--success-indicator: #38A169; /* Puntos vivos y checks */
--success-container: #EFFAF3;
--on-success-container: #276749;
--disabled-bg: #E2E8F0;
--disabled-fg: #6B7688;       /* 3.73:1 sobre fondo deshabilitado */
```
### 10.2 Design Rules & Invariants
- **Color never goes alone**: Every severity status must carry color, glyph, uppercase label (`CRÍTICO`, `ALERTA`, `SEGURO`), and structural position.
- **No decorative charts**: Absolutely no pie, bar, or area charts. Metrics are displayed as tabular numbers (`tabular-nums`).
- **Single Primary Action**: Each view or modal renders at most 1 enabled `.btn--primary` button (`primarios <= 1`) to prevent operator hesitation during clinical emergencies.
- **Typography**: `Inter` for interface elements; `Fira Code` exclusively for IPs, timestamps, incident IDs, JSON, and decision logic.
---
## 11. TECHNOLOGY STACK AND ARCHITECTURE
### 11.1 Backend & Database
- **Backend API**: Python 3.11+ with FastAPI, structured in layered architecture (`routers` → `services` → `core/database`). Pydantic v2 schemas for all inputs/outputs.
- **Database**: PostgreSQL 16/17 with relational schema defined in `database/schema.sql` matching `docs/er-diagram.md` plus operator profile fields (`institution`, `phone`, `avatar_url`). Connection pooling via `asyncpg`.
- **Security & Auth**: JWT bearer token / role header (`X-Hera-Role`) with role-based route dependencies (`require_role("Coordinador SOC")`).
### 11.2 Frontend Web Architecture
- **Client Architecture**: Semantic, modular SPA (`index.html`, `tokens.css`, `app.css`, `api.js`, `ui.js`, `views.js`, `modals.js`, `app.js`) served via Caddy reverse proxy (`Caddyfile`), routing `/api/*` to FastAPI (`backend:8000`).
---
## 12. DATA MODEL & RELATIONAL SCHEMA
Implemented strictly according to `docs/er-diagram.md` in `database/schema.sql`:
- `roles`: `role_id` (PK), `role_name`, `description`. Includes `CISO`, `Coordinador SOC`, `Analista Junior SOC`, `Analista Senior SOC`.
- `units`: `unit_id` (PK), `unit_name`, `is_critical` (BOOLEAN), `unit_type` (`ICU`, `OR`, `ER`, `OTHER`), `department`.
- `users`: `user_id` (PK), `username`, `email`, `full_name`, `job_title`, `institution`, `phone`, `avatar_url`, `shift_schedule`, `unit_id` (FK), `role_id` (FK), `active`, `is_isolated`, `keycloak_id`, `ad_guid`.
- `auth_events`: `event_id` (PK), `user_id` (FK), `event_timestamp`, `ip_address`, `geo_country`, `asn`, `is_vpn`, `outcome`, `auth_method`, `raw_json` (JSONB).
- `alerts`: `alert_id` (PK), `incident_code`, `event_id` (FK), `user_id` (FK), `severity`, `alert_status`, `model_type`, `risk_score`, `alert_timestamp`.
- `decision_paths`: `path_id` (PK), `alert_id` (FK), `node_index`, `split_feature`, `split_condition`, `split_value`, `node_outcome`, `rule_explanation`.
- `whitelist_entries`: `whitelist_id` (PK), `user_id` (FK), `country`, `asn`, `cidr`, `scope`, `start_date`, `end_date`, `state`, `active`, `reason`, `created_by` (FK).
- `quarantine_actions`: `action_id` (PK), `user_id` (FK), `alert_id` (FK), `action_status`, `reason`, `requested_by` (FK), `approved_by` (FK), `two_step_confirmed`, `blocked_due_to_critical_unit`, `simulated`.
- `audit_logs`: `log_id` (PK), `actor_username`, `action_type`, `resource_type`, `resource_id`, `details` (JSONB), `client_ip`, `created_at`.
---
## 13. API SPECIFICATION (Base Prefix: `/api/v1`)
Envelope standard: `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }`.
| Module | Method & Route | Access Role | Description |
|---|---|---|---|
| Auth | `POST /auth/login` | Public | Authenticates user (`coordinador`, `junior`, `senior`, `ciso`); returns session token and profile info. |
| Auth | `POST /auth/logout` | Authenticated | Closes active operator session and logs audit event. |
| Auth | `GET /auth/me` | Authenticated | Returns current authenticated user profile and role permissions. |
| Auth | `PUT /auth/profile` | Authenticated | Updates operator profile (`full_name`, `institution`, `email`, `phone`, `shift_schedule`, `avatar_url`). |
| Dashboard | `GET /dashboard/kpis` | Junior, Senior, Coordinator, CISO | Returns KPIs for specified temporal window (`window_hours`, default 24h). |
| Alerts | `GET /alerts` | Junior, Senior, Coordinator, CISO | Query alerts. Parameters: `window_hours` (default 24), `severity`, `unit`, `country`. |
| Alerts | `GET /alerts/{id}` | Junior, Senior, Coordinator, CISO | Detailed alert view including full forensic timeline. |
| Explain | `GET /alerts/{id}/decision-path` | Junior, Senior, Coordinator, CISO | Returns ordered nodes of decision tree for white-box explainability (`FR-004`). |
| Mitigate | `POST /actions/isolate` | Coordinador SOC only | Executes two-step isolation. Validates `BR-002`; enforces `403` for Junior/Senior analysts. |
| Whitelist | `GET /whitelist` | Junior, Senior, Coordinator, CISO | Lists active/expired geographic exceptions. |
| Whitelist | `POST /whitelist` | Coordinador SOC only | Creates geographic exception with mandatory date, CIDR, and justification. |
| Whitelist | `DELETE /whitelist/{id}` | Coordinador SOC only | Deactivates or removes whitelist rule; logs audit trail. |
| Forensics | `GET /forensics/users/{username}` | Junior, Senior, Coordinator, CISO | Queries historical data lake events for a specific user (`180 days`, filterable by `window`). |
| Export | `GET /alerts/{id}/export` | Junior, Senior, Coordinator, CISO | Generates standardized STIX 2.1 / JSON forensic package. |
---
## 14. DIRECTORY STRUCTURE
```
HeraUEBA/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI instance, CORS, middleware, lifecycle
│   │   ├── core/                     # config.py, security.py, database.py
│   │   ├── models/                   # Relational domain models matching ERD
│   │   ├── schemas/                  # Pydantic v2 validation DTOs
│   │   ├── routers/                  # auth.py, alerts.py, actions.py, whitelist.py, forensics.py
│   │   ├── services/                 # Business logic, BR-001/BR-002 enforcement, explainability
│   │   └── seed/                     # Seed loader (catalogs, critical units, sample alerts)
│   ├── tests/                        # Pytest suite (unit, integration, rules)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html                    # SPA Shell with profile hover menu & updated navigation
│   ├── Caddyfile                     # Reverse proxy (/api/* -> backend:8000) + static server
│   ├── assets/
│   │   ├── tokens.css                # Canonical tokens from Stitch-prototype/tokens.css
│   │   ├── app.css                   # Layout, login, profile hover menu, and component styling
│   │   ├── api.js                    # Fetch client connecting to /api/v1 + interactive datasets
│   │   ├── ui.js                     # UI components, badges, white-box tree builder
│   │   ├── views.js                  # All 9 view renderers (login, dashboard, alerta, whitelist, historial, aislamiento, error-unidad-critica, trazabilidad, perfil)
│   │   ├── modals.js                 # 2-step isolation & BR-002 modal handlers
│   │   └── app.js                    # Hash router, interactive filters & event orchestration
│   └── Dockerfile
├── database/
│   ├── schema.sql                    # Pure DDL script for all tables, indexes, constraints
│   └── seed.sql                      # Initial catalogs, clinical units, and multi-window alerts
├── docs/                             # Project documentation (SRS, diagrams, decisions)
├── docker-compose.yml                # Backend, PostgreSQL, Frontend/Reverse Proxy
├── Makefile                          # up, down, test, seed, verify
└── README.md
```
---
## 15. SEQUENTIAL IMPLEMENTATION PLAN
### Stage 1 — Environment and Database Foundation
- Create `docker-compose.yml` with PostgreSQL 17, FastAPI backend, and Caddy frontend proxy.
- Execute `database/schema.sql` defining all 9 ERD tables, foreign keys, and indexes.
- Seed database (`database/seed.sql`) with clinical units (`UCI`, `Quirófano`, `Urgencias` marked as `is_critical = true`), roles (`Coordinador SOC`, `Analista Junior SOC`, `Analista Senior SOC`, `CISO`), and multi-window alerts/events.
### Stage 2 — Backend Core & Telemetry Ingestion
- Implement FastAPI application with database connection pooling and Pydantic validation.
- Implement `/api/v1/alerts` with interactive temporal filtering (`1h`, `24h` default, `7d`, `30d`) (`FR-002`).
- Implement `/api/v1/alerts/{id}/decision-path` returning normalized decision nodes (`FR-004`).
### Stage 3 — Security, Mitigation Engine, Auth & Business Rules
- Implement authentication (`POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`) and profile configuration (`PUT /api/v1/auth/profile`).
- Implement RBAC middleware verifying `Coordinador SOC` role for write operations.
- Implement `POST /api/v1/actions/isolate` service enforcing `BR-002` (`HTTP 422`), two-step validation, and `HTTP 403` for Junior/Senior analysts.
### Stage 4 — Whitelist Management & Forensics
- Implement `/api/v1/whitelist` endpoints with IPv4 CIDR regex validation, expiration date constraint, and audit trail.
- Implement `/api/v1/forensics/users/{username}` querying events across the 180-day retention store.
### Stage 5 — Complete Frontend Views & Automated Verification
- Implement all 9 SPA routes (`#/login`, `#/dashboard`, `#/alerta/:id`, `#/whitelist`, `#/historial`, `#/aislamiento`, `#/error-unidad-critica`, `#/trazabilidad`, `#/perfil`).
- Connect interactive time windows, dynamic critical filter button, and profile hover menu.
- Run Pytest (`make test`) and Puppeteer (`make verify`) against the running stack.
---
## 16. TEST CATALOG
| Test ID | Objective | Layer | Requirement |
|---|---|---|---|
| T-01 | Default alerts query returns strictly events within last 24 hours; 30d window returns extended alerts | Integration | FR-002 |
| T-02 | Decision tree endpoint returns ordered nodes with split conditions and observed values | Integration | FR-004 |
| T-03 | Junior role attempting isolation receives HTTP 403 Forbidden | Security | NFR-003 |
| T-04 | Coordinator attempting isolation on ICU/OR/ER user receives HTTP 422 with BR-002 error | Business Rule | FR-007, BR-002 |
| T-05 | Coordinator isolation succeeds on non-critical user with two-step validation and logs audit | Integration | FR-005, FR-006 |
| T-06 | Whitelist rejects invalid CIDR or missing expiration date & Forensics returns 180d history | Validation | FR-003, FR-008 |
| T-07 | Senior Analyst login succeeds with read-only RBAC & Coordinator profile update persists in DB | Integration | NFR-003, NFR-004 |
| T-08 | Critical alert card rendered above 900px viewport fold without scroll & WCAG 2.2 AA contrast | E2E (Puppeteer) | FR-001, NFR-002, DESIGN.md |
---
## 17. FINAL VERIFICATION CHECKLIST
- [x] All 8 Functional Requirements and 2 Business Rules enforced in backend and frontend.
- [x] Login view (`#/login`) authenticates Coordinador SOC and Analista SOC (Junior & Senior).
- [x] Left-rail prototype view/role selector ("Simular rol") and "Prompts de Stitch" removed from UI.
- [x] Critical alerts filter button dynamically updates its label (`Revisar las X críticas` ↔ `Ver todas las alertas (Y)`).
- [x] Query time windows (`1 h`, `24 h`, `7 d`, `30 d` and forensic filters) actively filter alerts, KPIs, and events.
- [x] Full standalone views implemented for 2-Step Isolation (`#/aislamiento`), Critical Unit Error (`#/error-unidad-critica`), Traceability Matrix (`#/trazabilidad`), and Account Configuration (`#/perfil`).
- [x] Profile hover menu in left rail provides direct access to **Configurar cuenta** and **Cerrar sesión**.
- [x] Primary critical alert triage occurs in first viewport without vertical scroll (< 900px) and satisfies WCAG 2.2 AA contrast.
