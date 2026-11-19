"""
Motor de Árbol de Decisión (Caja Blanca · FR-004) para HeraUEBA.

Totalmente alineado con el esquema de PostgreSQL (`alerts`, `decision_paths`,
`auth_events`, `whitelist_entries`, `units`) y el contrato UI del frontend:
- `node_outcome` ∈ {'CIERTO', 'FALSO', 'COMPROBACIÓN', 'BR-002'}
- `ui_verdict` (`v`) ∈ {'true', 'false', 'verify', 'block'}
- Cumplimiento estricto de BR-001 (cero bloqueos automáticos, umbral 0.98)
  y BR-002 (exención de aislamiento en unidades críticas: UCI, Quirófano, Urgencias).
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple
from pydantic import BaseModel, Field

from app.core.config import settings

ABUSE_ASN_KEYWORDS = (
    "60729",  # Tor Exit Node Network
    "9009",   # M247 Europe SRL
    "45899",  # VNPT Smart Cloud
    "tor",
    "vpn",
    "m247",
)

CRITICAL_UNIT_TYPES = {"ICU", "OR", "ER"}


class AuthEventFeatures(BaseModel):
    """Atributos de telemetría Keycloak + IPinfo + contexto clínico para evaluación UEBA."""

    alert_id: str = Field(default="EVAL-DT-001", description="Código de incidente o simulación")
    username: str = Field(..., min_length=2, description="Nombre de usuario hospitalario")
    ip_address: str = Field(default="185.220.101.47", description="IPv4 origen")
    geo_country: str = Field(default="Colombia", description="País origen (IPinfo)")
    geo_cc: str = Field(default="CO", description="Código ISO-2 del país")
    asn: str = Field(default="ASN 3816 · Colombia Telecomunicaciones", description="ASN / ISP origen")
    is_tor: bool = Field(default=False, description="¿IP perteneciente a nodo de salida Tor?")
    is_vpn: bool = Field(default=False, description="¿IP perteneciente a VPN/proxy no institucional?")

    # Señales de comportamiento UEBA
    failed_attempts_15m: int = Field(default=0, ge=0, description="intentos_fallidos_15m")
    attempt_window_min: float = Field(default=15.0, ge=0.0, description="ventana_entre_intentos_min")
    geovelocity_kmh: float = Field(default=0.0, ge=0.0, description="geovelocidad en km/h entre sesiones")
    concurrent_foreign_sessions: bool = Field(default=False, description="Dos sesiones activas en países distintos")
    unregistered_device: bool = Field(default=False, description="dispositivo_nunca_visto")
    device_fingerprint: str = Field(default="conocido", description="Huella del dispositivo")
    prior_failed_isolations: int = Field(default=0, ge=0, description="aislamiento_previo_fallido")
    clinical_write_privilege: bool = Field(default=False, description="privilegios_sobre_recursos_clinicos")

    # Contexto de identidad y unidad clínica
    mfa_enabled: bool = Field(default=True, description="Estado MFA del titular / sesión")
    auth_method: str = Field(default="mfa", description="password | mfa | sso | api_rest")
    is_whitelisted_geo: Optional[bool] = Field(
        default=None,
        description="Si es None, se calcula contra whitelist_entries o país CO",
    )
    unit_name: str = Field(default="Neurología", description="Unidad clínica del usuario")
    unit_type: str = Field(default="OTHER", description="ICU | OR | ER | OTHER")
    is_critical_unit: Optional[bool] = Field(
        default=None,
        description="BR-002: si es None, se infiere desde unit_name / unit_type",
    )


def ip_matches_whitelist(
    ip_address: str,
    whitelist_cidrs: Iterable[str],
) -> Tuple[bool, Optional[str]]:
    """Verifica si una dirección IPv4 pertenece a algún CIDR activo de `whitelist_entries`."""
    try:
        ip_obj = ipaddress.ip_address(ip_address.strip())
    except ValueError:
        return False, None

    for cidr in whitelist_cidrs:
        try:
            net = ipaddress.ip_network(cidr.strip(), strict=False)
            if ip_obj in net:
                return True, cidr.strip()
        except ValueError:
            continue
    return False, None


def _is_critical_unit(features: AuthEventFeatures) -> bool:
    if features.is_critical_unit is not None:
        return features.is_critical_unit
    if features.unit_type.upper() in CRITICAL_UNIT_TYPES:
        return True
    norm_unit = features.unit_name.strip().lower()
    return any(u.lower() in norm_unit for u in settings.CRITICAL_UNITS)


def _is_suspicious_asn(features: AuthEventFeatures) -> bool:
    if features.is_tor or features.is_vpn:
        return True
    asn_low = features.asn.lower()
    return any(k in asn_low for k in ABUSE_ASN_KEYWORDS)


def _is_whitelisted(features: AuthEventFeatures, active_cidrs: Optional[Iterable[str]] = None) -> Tuple[bool, str]:
    if features.is_whitelisted_geo is not None:
        if features.is_whitelisted_geo:
            return True, f"{features.geo_country} ∈ whitelist vigente"
        return False, f"{features.geo_country} ≠ Colombia (fuera de whitelist)"

    if active_cidrs is not None:
        matched, cidr = ip_matches_whitelist(features.ip_address, active_cidrs)
        if matched:
            return True, f"{features.ip_address} ∈ {cidr} (whitelist activa)"

    if features.geo_cc.upper() in ("CO", "INT"):
        return True, f"{features.geo_country} ∈ red/país habitual (CO)"

    return False, f"{features.geo_country} ≠ Colombia"


def _make_node(
    index: int,
    node_name: str,
    split_feature: str,
    split_condition: str,
    split_value: str,
    observed_value: str,
    node_outcome: str,
    ui_verdict: str,
    rule_explanation: str,
    confidence: float,
    is_leaf: bool = False,
    leaf_class: str = "ANOMALOUS",
) -> Dict[str, Any]:
    return {
        "node_index": index,
        "i": index,
        "node_id": f"node_{index:02d}",
        "node_name": node_name,
        "split_feature": split_feature,
        "split_condition": split_condition,
        "split_value": split_value,
        "observed_value": observed_value,
        "obs": observed_value,
        "node_outcome": node_outcome,
        "v": ui_verdict,
        "rule": rule_explanation,
        "rule_explanation": rule_explanation,
        "is_leaf": is_leaf,
        "leaf_class": leaf_class,
        "confidence": round(confidence, 2),
    }


def _br002_guard_node(features: AuthEventFeatures, is_critical: bool, risk_score: float) -> Dict[str, Any]:
    """Nodo 5 obligatorio en HeraUEBA: Guardia de Unidad Crítica (BR-002 / FR-007)."""
    if is_critical and risk_score >= 0.50:
        return _make_node(
            index=5,
            node_name="Restricción BR-002",
            split_feature="unidad_en_lista_critica",
            split_condition="==",
            split_value="true",
            observed_value=f"true — {features.unit_name} (BR-002)",
            node_outcome="BR-002",
            ui_verdict="block",
            rule_explanation="unidad_en_lista_critica",
            confidence=1.00,
            is_leaf=True,
            leaf_class="ANOMALOUS",
        )

    leaf_cls = "ANOMALOUS" if risk_score >= 0.80 else ("SUSPICIOUS" if risk_score >= 0.45 else "NORMAL")
    obs = (
        f"true — {features.unit_name} (sin riesgo crítico)"
        if is_critical
        else f"false — {features.unit_name} no está en UCI, Quirófano ni Urgencias"
    )
    return _make_node(
        index=5,
        node_name="Guardia de unidad crítica",
        split_feature="usuario_unidad_critica?",
        split_condition="==",
        split_value="false",
        observed_value=obs,
        node_outcome="COMPROBACIÓN",
        ui_verdict="verify",
        rule_explanation="usuario_unidad_critica?",
        confidence=1.00,
        is_leaf=True,
        leaf_class=leaf_cls,
    )


@dataclass(frozen=True)
class BranchResult:
    verdict: str
    incidence: str
    severity: str
    ui_sev: str
    risk_score: float
    global_rule: str
    branch: str
    reading: str
    nodes: List[Dict[str, Any]]


def _eval_brute_force_branch(
    f: AuthEventFeatures, whitelisted: bool, wl_obs: str, is_critical: bool
) -> BranchResult:
    fast_burst = f.attempt_window_min < 2.0
    outside_wl = not whitelisted
    mfa_ok = f.mfa_enabled and f.auth_method != "api_rest"

    score = 0.78
    if fast_burst:
        score += 0.08
    if outside_wl:
        score += 0.05
    if not mfa_ok:
        score += 0.03
    score = min(score, round(settings.AUTO_BLOCK_THRESHOLD - 0.04, 2))  # Máx 0.94 (BR-001)

    nodes = [
        _make_node(
            1, "Frecuencia de fallos", "intentos_fallidos_15m", ">", "8",
            str(f.failed_attempts_15m), "CIERTO", "true", "intentos_fallidos_15m > 8", 0.96,
        ),
        _make_node(
            2, "Ventana entre intentos", "ventana_entre_intentos_min", "<", "2",
            f"{f.attempt_window_min:.1f} min",
            "CIERTO" if fast_burst else "FALSO",
            "true" if fast_burst else "false",
            "ventana_entre_intentos_min < 2", 0.95,
        ),
        _make_node(
            3, "Validación geográfica", "pais_origen", "≠", "whitelist_usuario",
            wl_obs,
            "CIERTO" if outside_wl else "FALSO",
            "true" if outside_wl else "false",
            "pais_origen ≠ whitelist_usuario", 0.98,
        ),
        _make_node(
            4, "Estado MFA en sesión", "mfa_activo", "==", "true",
            "true — MFA verificado" if mfa_ok else f"false — método {f.auth_method}",
            "CIERTO" if mfa_ok else "FALSO",
            "true" if mfa_ok else "false",
            "mfa_activo == true", 0.91,
            leaf_class="SUSPICIOUS" if not mfa_ok else "ANOMALOUS",
        ),
        _br002_guard_node(f, is_critical, score),
    ]

    branch = (
        "Rama izquierda (fuerza bruta), detenida por BR-002 en el nodo 5"
        if is_critical
        else "Rama izquierda del árbol (fuerza bruta · MITRE T1078)"
    )
    reading = (
        f"Combinación de {f.failed_attempts_15m} intentos fallidos en {f.attempt_window_min:.1f} min "
        f"desde {f.geo_country}. "
        + (
            f"El nodo 5 detiene el aislamiento por BR-002 ({f.unit_name}) y exige escalamiento al CISO."
            if is_critical
            else "Se recomienda revisión humana y aislamiento en dos pasos por el Coordinador SOC (BR-001)."
        )
    )
    return BranchResult(
        verdict="CREDENCIAL COMPROMETIDA",
        incidence="ALTA" if score < 0.95 else "CRÍTICA",
        severity="CRÍTICO",
        ui_sev="critico",
        risk_score=score,
        global_rule="intentos > 8   AND   ventana < 2 min   AND   pais ≠ whitelist",
        branch=branch,
        reading=reading,
        nodes=nodes,
    )


def _eval_admin_compromise_branch(
    f: AuthEventFeatures, whitelisted: bool, wl_obs: str, is_critical: bool
) -> BranchResult:
    outside_wl = not whitelisted
    score = 0.85 + (0.03 if not f.mfa_enabled else 0.0) + (0.03 if f.clinical_write_privilege else 0.0)
    score = min(score, 0.93)

    nodes = [
        _make_node(
            1, "Historial de aislamiento", "aislamiento_previo_fallido", ">=", "3",
            f"{f.prior_failed_isolations} intentos previos", "CIERTO", "true",
            "aislamiento_previo_fallido >= 3", 0.94,
        ),
        _make_node(
            2, "Estado MFA titular", "mfa_habilitada", "==", "true",
            "true — activa" if f.mfa_enabled else "false — desactivada por el titular",
            "CIERTO" if f.mfa_enabled else "FALSO",
            "true" if f.mfa_enabled else "false",
            "mfa_habilitada", 0.93,
            leaf_class="SUSPICIOUS",
        ),
        _make_node(
            3, "Privilegios clínicos", "privilegios_sobre_recursos_clinicos", "==", "true",
            "true — escritura en HISTORIAL_CLINICO" if f.clinical_write_privilege else "false — solo lectura",
            "CIERTO" if f.clinical_write_privilege else "FALSO",
            "true" if f.clinical_write_privilege else "false",
            "privilegios_sobre_recursos_clinicos", 0.97,
        ),
        _make_node(
            4, "Validación geográfica", "pais_origen", "≠", "whitelist_institucional",
            wl_obs,
            "CIERTO" if outside_wl else "FALSO",
            "true" if outside_wl else "false",
            "pais_origen ≠ whitelist_institucional", 0.96,
        ),
        _br002_guard_node(f, is_critical, score),
    ]

    branch = (
        "Rama administrativa, detenida por BR-002 en el nodo 5"
        if is_critical
        else "Rama administrativa (aislamiento previo fallido)"
    )
    reading = (
        f"Se registran {f.prior_failed_isolations} aislamientos previos fallidos con acceso desde {f.geo_country}. "
        + (
            f"El nodo 5 invoca BR-002 ({f.unit_name}) y obliga al escalamiento normativo al CISO."
            if is_critical
            else "Requiere contención supervisada en dos pasos por el Coordinador SOC (BR-001)."
        )
    )
    return BranchResult(
        verdict="COMPROMISO DE CUENTA ADMINISTRATIVA",
        incidence="CRÍTICA",
        severity="CRÍTICO",
        ui_sev="critico",
        risk_score=score,
        global_rule="aislamiento_fallido >= 3   AND   escritura_clinico   AND   mfa_ausente",
        branch=branch,
        reading=reading,
        nodes=nodes,
    )


def _eval_suspicious_asn_branch(
    f: AuthEventFeatures, whitelisted: bool, wl_obs: str, is_critical: bool
) -> BranchResult:
    mfa_missing = not f.mfa_enabled
    outside_wl = not whitelisted
    score = 0.72 + (0.07 if f.unregistered_device else 0.0) + (0.05 if mfa_missing else 0.0) + (0.04 if outside_wl else 0.0)
    score = min(score, 0.90)

    nodes = [
        _make_node(
            1, "Reputación ASN", "asn_origen", "∈", "feed_abuse_conocido",
            f"{f.asn}" + (" · Tor" if f.is_tor else (" · VPN" if f.is_vpn else "")),
            "CIERTO", "true", "asn_origen ∈ feed_abuse_conocido", 0.92,
        ),
        _make_node(
            2, "Huella de dispositivo", "dispositivo_nunca_visto", "==", "true",
            f"true · fingerprint {f.device_fingerprint}" if f.unregistered_device else "false · terminal conocido",
            "CIERTO" if f.unregistered_device else "FALSO",
            "true" if f.unregistered_device else "false",
            "dispositivo_nunca_visto", 0.89,
        ),
        _make_node(
            3, "Registro MFA", "mfa_no_registrada", "==", "true",
            "true · methods = [password]" if mfa_missing else "false · MFA enrolado",
            "CIERTO" if mfa_missing else "FALSO",
            "true" if mfa_missing else "false",
            "mfa_no_registrada", 0.90,
        ),
        _make_node(
            4, "Validación geográfica", "pais_origen", "≠", "whitelist_usuario",
            wl_obs,
            "CIERTO" if outside_wl else "FALSO",
            "true" if outside_wl else "false",
            "pais_origen ≠ whitelist_usuario", 0.95,
        ),
        _br002_guard_node(f, is_critical, score),
    ]

    branch = (
        "Rama ASN/dispositivo, detenida por BR-002 en el nodo 5"
        if is_critical
        else "Rama ASN sospechoso + dispositivo nuevo"
    )
    reading = (
        f"Conexión desde {f.asn} ({f.geo_country}) con evaluación de dispositivo y MFA. "
        + (
            f"El nodo 5 invoca BR-002 ({f.unit_name}): el motor no propone aislamiento; propone escalamiento al CISO."
            if is_critical
            else "Escalar a verificación del Coordinador SOC sin bloqueo automático (BR-001)."
        )
    )
    return BranchResult(
        verdict="POSIBLE COMPROMISO DE CREDENCIAL",
        incidence="ALTA" if score >= 0.80 else "MEDIA",
        severity="CRÍTICO" if score >= 0.85 else "ALERTA",
        ui_sev="critico" if score >= 0.85 else "media",
        risk_score=score,
        global_rule="asn_abuse   AND   dispositivo_nuevo   AND   mfa_ausente",
        branch=branch,
        reading=reading,
        nodes=nodes,
    )


def _eval_geovelocity_branch(
    f: AuthEventFeatures, whitelisted: bool, wl_obs: str, is_critical: bool
) -> BranchResult:
    outside_wl = not whitelisted
    if whitelisted:
        score = 0.22
        verdict = "EXCEPCIÓN DE WHITELIST VALIDADA"
        incidence = "BAJA"
        severity, ui_sev = "SEGURO", "info"
        branch = "Rama derecha (geovelocidad mitigada por Whitelist)"
        reading = (
            f"Desplazamiento de {f.geovelocity_kmh:.0f} km/h hacia {f.geo_country} cubierto por excepción "
            "geográfica vigente (FR-008). Falso positivo mitigado automáticamente."
        )
    else:
        score = 0.68 if f.geovelocity_kmh > 900 else 0.56
        if f.concurrent_foreign_sessions:
            score += 0.08
        if not f.mfa_enabled:
            score += 0.12
        score = min(score, 0.92)
        verdict = "VIAJE IMPOSIBLE · REVISIÓN HUMANA"
        incidence = "ALTA" if score >= 0.80 else "MEDIA"
        severity = "CRÍTICO" if score >= 0.85 else "ALERTA"
        ui_sev = "critico" if score >= 0.85 else "media"
        branch = (
            "Rama derecha (geovelocidad), detenida por BR-002 en el nodo 5"
            if is_critical
            else "Rama derecha del árbol (geovelocidad / viaje imposible)"
        )
        reading = (
            f"Geovelocidad de {f.geovelocity_kmh:.0f} km/h hacia {f.geo_country} sin excepción en whitelist. "
            + (
                f"BR-002 protege a la unidad {f.unit_name}: no se permite aislamiento estándar."
                if is_critical
                else "Validar viaje médico o VPN corporativa antes de escalar."
            )
        )

    nodes = [
        _make_node(
            1, "Geovelocidad entre sesiones", "geovelocidad_kmh", ">", "700",
            f"{f.geovelocity_kmh:.0f} km/h", "CIERTO", "true", "geovelocidad_kmh > 700", 0.93,
        ),
        _make_node(
            2, "Validación de Whitelist geográfica", "pais_origen", "≠", "whitelist_usuario",
            wl_obs,
            "CIERTO" if outside_wl else "FALSO",
            "true" if outside_wl else "false",
            "pais_origen ≠ whitelist_usuario", 0.97,
        ),
        _make_node(
            3, "Sesiones simultáneas", "sesiones_simultaneas_paises_distintos", "==", "true",
            "true — sesiones concurrentes" if f.concurrent_foreign_sessions else "false — sesión secuencial",
            "CIERTO" if f.concurrent_foreign_sessions else "FALSO",
            "true" if f.concurrent_foreign_sessions else "false",
            "sesiones_simultaneas_paises_distintos", 0.88,
        ),
        _make_node(
            4, "Estado MFA en sesión", "mfa_activo", "==", "true",
            "true — MFA verificado" if f.mfa_enabled else "false — sin MFA",
            "CIERTO" if f.mfa_enabled else "FALSO",
            "true" if f.mfa_enabled else "false",
            "mfa_activo == true", 0.91,
        ),
        _br002_guard_node(f, is_critical, score),
    ]

    return BranchResult(
        verdict=verdict,
        incidence=incidence,
        severity=severity,
        ui_sev=ui_sev,
        risk_score=score,
        global_rule="geovelocidad > 700 km/h   AND   pais ≠ whitelist",
        branch=branch,
        reading=reading,
        nodes=nodes,
    )


def _eval_normal_branch(
    f: AuthEventFeatures, whitelisted: bool, wl_obs: str, is_critical: bool
) -> BranchResult:
    outside_wl = not whitelisted
    score = 0.42 if outside_wl else 0.12
    verdict = "ACCESO EXTRANJERO EN OBSERVACIÓN" if outside_wl else "ACCESO LEGÍTIMO · SIN ANOMALÍAS"
    incidence = "MEDIA" if outside_wl else "BAJA"
    severity = "ALERTA" if outside_wl else "SEGURO"
    ui_sev = "media" if outside_wl else "info"

    nodes = [
        _make_node(
            1, "Frecuencia de fallos", "intentos_fallidos_15m", ">", "8",
            str(f.failed_attempts_15m), "FALSO", "false", "intentos_fallidos_15m > 8", 0.98,
        ),
        _make_node(
            2, "Reputación ASN", "asn_origen", "∈", "feed_abuse_conocido",
            f.asn, "FALSO", "false", "asn_origen ∈ feed_abuse_conocido", 0.95,
        ),
        _make_node(
            3, "Geovelocidad entre sesiones", "geovelocidad_kmh", ">", "700",
            f"{f.geovelocity_kmh:.0f} km/h", "FALSO", "false", "geovelocidad_kmh > 700", 0.96,
        ),
        _make_node(
            4, "Validación geográfica", "pais_origen", "≠", "whitelist_usuario",
            wl_obs,
            "CIERTO" if outside_wl else "FALSO",
            "true" if outside_wl else "false",
            "pais_origen ≠ whitelist_usuario", 0.97,
        ),
        _br002_guard_node(f, is_critical, score),
    ]

    return BranchResult(
        verdict=verdict,
        incidence=incidence,
        severity=severity,
        ui_sev=ui_sev,
        risk_score=score,
        global_rule="intentos <= 8   AND   geovelocidad <= 700 km/h   AND   asn_seguro",
        branch="Rama base (comportamiento habitual)",
        reading=(
            f"Inicio de sesión desde {f.geo_country} sin ráfagas de fuerza bruta ni viaje imposible."
        ),
        nodes=nodes,
    )


def evaluate_decision_tree(
    features: AuthEventFeatures,
    active_whitelist_cidrs: Optional[Iterable[str]] = None,
) -> Dict[str, Any]:
    """
    Evalúa un evento de autenticación en el árbol de decisión de HeraUEBA.

    Retorna una estructura 100% compatible con `GET /api/v1/alerts/{id}/decision-path`,
    `DecisionPathResponseDTO` y la tabla `decision_paths` de PostgreSQL.
    """
    whitelisted, wl_obs = _is_whitelisted(features, active_whitelist_cidrs)
    is_critical = _is_critical_unit(features)

    # Enrutamiento jerárquico del árbol de decisión (raíz → subárboles de 5 nodos)
    if features.failed_attempts_15m > 8:
        res = _eval_brute_force_branch(features, whitelisted, wl_obs, is_critical)
    elif features.prior_failed_isolations >= 3:
        res = _eval_admin_compromise_branch(features, whitelisted, wl_obs, is_critical)
    elif _is_suspicious_asn(features) and (features.unregistered_device or not features.mfa_enabled):
        res = _eval_suspicious_asn_branch(features, whitelisted, wl_obs, is_critical)
    elif features.geovelocity_kmh > 700.0 or features.concurrent_foreign_sessions:
        res = _eval_geovelocity_branch(features, whitelisted, wl_obs, is_critical)
    else:
        res = _eval_normal_branch(features, whitelisted, wl_obs, is_critical)

    # BR-001: El score nunca puede autorizar bloqueo automático (< AUTO_BLOCK_THRESHOLD)
    safe_risk = min(round(res.risk_score, 2), round(settings.AUTO_BLOCK_THRESHOLD - 0.01, 2))

    return {
        "alert_id": features.alert_id,
        "model_type": "DECISION_TREE",
        "verdict": res.verdict,
        "factor": safe_risk,
        "incidence": res.incidence,
        "severity": res.severity,
        "ui_sev": res.ui_sev,
        "auto_block_threshold": settings.AUTO_BLOCK_THRESHOLD,
        "globalRule": res.global_rule,
        "global_rule": res.global_rule,
        "branch": res.branch,
        "reading": res.reading,
        "br_001_auto_block_allowed": False,
        "br_002_critical_unit_protected": is_critical,
        "nodes": res.nodes,
    }
