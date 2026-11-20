import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, Optional
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings

ph = PasswordHasher()
security_scheme = HTTPBearer(auto_error=False)

ROLE_MAPPING = {
    "coordinador": {
        "username": "carla.restrepo",
        "user_id": 6,
        "role_name": "Coordinador SOC",
        "role_key": "coordinador",
        "full_name": "Carla M. Restrepo",
        "initials": "CR",
        "email": "carla.restrepo@hospital.local",
        "institution": "Clínica Central · Nodo SOC-BOG-01",
        "phone": "+57 310 482 9104",
        "job_title": "Coordinadora SOC",
        "shift_schedule": "Permanente · Guardia Resolutiva",
        "can_isolate": True,
    },
    "junior": {
        "username": "diego.fuentes",
        "user_id": 7,
        "role_name": "Analista Junior SOC",
        "role_key": "junior",
        "full_name": "Diego A. Fuentes",
        "initials": "DF",
        "email": "diego.fuentes@hospital.local",
        "institution": "Clínica Central · Nodo SOC-BOG-01",
        "phone": "+57 315 890 2231",
        "job_title": "Analista Junior SOC",
        "shift_schedule": "Turno Diurno 06:00–18:00",
        "can_isolate": False,
    },
    "senior": {
        "username": "valeria.soto",
        "user_id": 9,
        "role_name": "Analista Senior SOC",
        "role_key": "senior",
        "full_name": "Ing. Valeria Soto M.",
        "initials": "VS",
        "email": "valeria.soto@hospital.local",
        "institution": "Clínica Central · Nodo SOC-BOG-01",
        "phone": "+57 318 654 1190",
        "job_title": "Analista Senior SOC",
        "shift_schedule": "Turno Nocturno 18:00–06:00",
        "can_isolate": False,
    },
}


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, stored_hash: str) -> bool:
    if not plain_password or not stored_hash:
        return False
    try:
        return ph.verify(stored_hash, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False


# Credenciales de los 3 perfiles SOC (solo hashes argon2id; nunca contraseñas en texto plano).
CREDENTIALS = {
    "carla.restrepo": {
        "role_key": "coordinador",
        "hash": "$argon2id$v=19$m=65536,t=3,p=4$Puv1BMhsAOMIcKC4SzM4UA$3sgESe9UtJx1sJaRMsUIbi2RIF7dQ4g7WkYW0gQzQQY",
    },
    "diego.fuentes": {
        "role_key": "junior",
        "hash": "$argon2id$v=19$m=65536,t=3,p=4$jDL51lUrEav5I0AoK54pOA$NcDwyGJX8EMDj/Dk1G/Nl8ZgoUeXjQJDTu/6/3XSBUI",
    },
    "valeria.soto": {
        "role_key": "senior",
        "hash": "$argon2id$v=19$m=65536,t=3,p=4$P7vmhd5vsOUIZACNIiWHRA$HKwPQLJQNJVGHBaSvpXxaYCM14e3a7Z2jsD0sd1980E",
    },
}

# Hash de relleno para igualar el tiempo de respuesta cuando el usuario no existe.
_DUMMY_HASH = CREDENTIALS["carla.restrepo"]["hash"]


# Límite de intentos fallidos: 5 por ventana de 5 minutos, por usuario y por IP.
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300
_failed_attempts: Dict[str, deque] = defaultdict(deque)


def _prune(key: str) -> deque:
    q = _failed_attempts[key]
    cutoff = time.monotonic() - LOCKOUT_WINDOW_SECONDS
    while q and q[0] < cutoff:
        q.popleft()
    return q


def is_locked_out(*keys: str) -> bool:
    return any(len(_prune(k)) >= MAX_FAILED_ATTEMPTS for k in keys)


def register_failure(*keys: str) -> None:
    for k in keys:
        _prune(k).append(time.monotonic())


def clear_failures(*keys: str) -> None:
    for k in keys:
        _failed_attempts.pop(k, None)


def authenticate(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Devuelve el perfil si usuario y contraseña son válidos; None en caso contrario."""
    entry = CREDENTIALS.get((username or "").strip().lower())
    ok = verify_password(password or "", entry["hash"] if entry else _DUMMY_HASH)
    if entry and ok:
        return dict(ROLE_MAPPING[entry["role_key"]])
    return None


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_TOKEN",
                "message": "Token de sesión inválido o expirado.",
                "details": str(exc),
            },
        )


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> Dict[str, Any]:
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif "hera_token" in request.cookies:
        token = request.cookies.get("hera_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_REQUIRED",
                "message": "Autenticación requerida. Inicia sesión para continuar.",
            },
        )

    payload = decode_access_token(token)
    role_key = payload.get("role_key")
    if role_key not in ROLE_MAPPING:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token de sesión inválido."},
        )
    return ROLE_MAPPING[role_key]


def RequireRole(*allowed_roles: str) -> Callable:
    async def role_dependency(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user["role_name"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "RBAC_FORBIDDEN",
                    "message": (
                        f"Permiso denegado por matriz de roles (NFR-003). "
                        f"El rol '{user['role_name']}' no está autorizado para ejecutar esta operación; "
                        f"se exige {', '.join(allowed_roles)}."
                    ),
                    "details": {
                        "active_role": user["role_name"],
                        "required_roles": list(allowed_roles),
                    },
                },
            )
        return user

    return role_dependency
