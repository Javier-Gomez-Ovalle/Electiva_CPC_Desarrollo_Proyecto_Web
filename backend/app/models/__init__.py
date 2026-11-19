from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, Optional

# Canonical Enumerations (Section 7.2)
SEVERIDADES = ("CRÍTICO", "ALERTA", "SEGURO")
ESTADOS_ALERTA = ("Abierta", "En observación", "Escalada", "Cerrada", "Aislada")
UNIDADES_CRITICAS = ("UCI", "Quirófano", "Urgencias")
ROLES_CANONICOS = ("CISO", "Coordinador SOC", "Analista Junior SOC")
ESTADOS_WHITELIST = ("activa", "por vencer", "expirada")
VEREDICTOS_NODO = ("CIERTO", "FALSO", "COMPROBACIÓN", "BR-002")
ACCIONES_CUARENTENA = ("PENDING", "APPROVED", "REJECTED", "EXECUTED", "CANCELLED")


@dataclass
class RoleEntity:
    role_id: int
    role_name: str
    description: str


@dataclass
class UnitEntity:
    unit_id: int
    unit_name: str
    is_critical: bool
    unit_type: str
    department: str


@dataclass
class UserEntity:
    user_id: int
    username: str
    email: str
    full_name: str
    unit_id: int
    role_id: int
    active: bool
    is_isolated: bool
    keycloak_id: Optional[str] = None
    ad_guid: Optional[str] = None


@dataclass
class AlertEntity:
    alert_id: int
    incident_code: str
    event_id: Optional[int]
    user_id: int
    severity: str
    alert_status: str
    model_type: str
    risk_score: float
    alert_timestamp: datetime
