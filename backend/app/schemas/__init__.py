import re
from datetime import date, datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")

CIDR_REGEX = re.compile(
    r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d|1\d|2\d|3[0-2]))?$"
)


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None


class LoginRequest(BaseModel):
    username: Optional[str] = "carla.restrepo"
    password: Optional[str] = "demo-pass-2026"
    role: Optional[str] = None


class UserProfileUpdateDTO(BaseModel):
    full_name: str = Field(..., min_length=3)
    email: str = Field(..., min_length=5)
    institution: str = Field(..., min_length=3)
    phone: str = Field(..., min_length=5)
    job_title: Optional[str] = None
    shift_schedule: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileDTO(BaseModel):
    user_id: int
    username: str
    full_name: str
    initials: str
    role_name: str
    role_key: str
    email: str
    institution: Optional[str] = "Clínica Central · Nodo SOC-BOG-01"
    phone: Optional[str] = "+57 310 482 9104"
    job_title: Optional[str] = None
    shift_schedule: Optional[str] = None
    avatar_url: Optional[str] = None
    can_isolate: bool


class TokenResponseDTO(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileDTO


class KpiSummaryDTO(BaseModel):
    window_hours: int
    critical_alerts: int
    medium_alerts: int
    isolated_accounts: int
    total_logins: int
    auto_block_threshold: float = 0.98
    max_risk_observed: float = 0.94


class DecisionNodeDTO(BaseModel):
    node_index: int
    i: int
    node_id: str
    node_name: str
    split_feature: str
    split_condition: str
    split_value: str
    observed_value: str
    obs: str
    node_outcome: str
    v: str
    rule: str
    rule_explanation: str
    is_leaf: bool
    confidence: float


class DecisionPathResponseDTO(BaseModel):
    alert_id: str
    model_type: str
    verdict: str
    factor: float
    incidence: str
    auto_block_threshold: float = 0.98
    global_rule: str
    branch: str
    reading: str
    nodes: List[DecisionNodeDTO]


class IsolationRequestDTO(BaseModel):
    username: str = Field(..., min_length=2)
    alert_id: Optional[str] = "INC-2026-0417"
    reason: str = Field(..., description="Justificación clínica y operativa (>= 30 caracteres)")
    reauth_password: str = Field(..., description="Re-autenticación del operador SOC")
    confirmation_word: str = Field(..., description="Palabra literal AISLAR")
    two_step_confirmed: bool = Field(default=True)
    notify_clinical: bool = Field(default=False)
    attach_evidence: bool = Field(default=False)


class WhitelistCreateDTO(BaseModel):
    cidr: str
    country: str
    scope: str = "Institucional"
    end_date: str = Field(..., description="Fecha de vigencia obligatoria YYYY-MM-DD")
    reason: str = Field(..., description="Justificación clínica (>= 15 caracteres)")
    audit_confirmed: bool = True
    username: Optional[str] = None

    @field_validator("cidr")
    @classmethod
    def validate_cidr(cls, v: str) -> str:
        val = (v or "").strip()
        if not CIDR_REGEX.match(val):
            raise ValueError("Usa una dirección IPv4 con máscara CIDR, por ejemplo 190.24.0.0/16.")
        octets = val.split("/")[0].split(".")
        for o in octets:
            if int(o) > 255:
                raise ValueError("Octeto IPv4 fuera de rango (0-255).")
        return val

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        val = (v or "").strip()
        if len(val) < 3:
            raise ValueError("Indica el país o el ámbito institucional (mínimo 3 caracteres).")
        return val

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, v: str) -> str:
        val = (v or "").strip()
        if not val:
            raise ValueError("Una whitelist sin vigencia es una puerta trasera: fija una fecha.")
        try:
            date.fromisoformat(val)
        except ValueError:
            raise ValueError("Formato de fecha inválido. Usa YYYY-MM-DD.")
        return val

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        val = (v or "").strip()
        if len(val) < 15:
            raise ValueError("La justificación clínica es obligatoria (mínimo 15 caracteres).")
        return val
