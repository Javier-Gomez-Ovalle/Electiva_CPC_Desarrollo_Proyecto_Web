from typing import Any, Dict
import asyncpg
from fastapi import APIRouter, Depends, Response
from app.core.database import get_db
from app.core.security import (
    ROLE_MAPPING,
    create_access_token,
    get_current_user,
    verify_password,
)
from app.schemas import ApiResponse, LoginRequest, UserProfileUpdateDTO
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    conn: asyncpg.Connection = Depends(get_db),
) -> Dict[str, Any]:
    role_key = (payload.role or "").strip().lower()
    uname = (payload.username or "").strip().lower()

    if role_key in ROLE_MAPPING:
        profile = dict(ROLE_MAPPING[role_key])
    elif "diego" in uname or "junior" in uname:
        profile = dict(ROLE_MAPPING["junior"])
    elif "valeria" in uname or "senior" in uname:
        profile = dict(ROLE_MAPPING["senior"])
    elif "ciso" in uname:
        profile = dict(ROLE_MAPPING["ciso"])
    else:
        profile = dict(ROLE_MAPPING["coordinador"])

    if payload.password and not verify_password(payload.password, "demo-pass-2026"):
        return {
            "success": False,
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Credenciales de dominio inválidas.",
            },
        }

    # Check if updated profile values exist in PostgreSQL users table
    db_user = await conn.fetchrow(
        "SELECT full_name, initials, email, institution, phone, job_title, shift_schedule, avatar_url FROM users WHERE user_id = $1",
        profile["user_id"],
    )
    if db_user:
        profile["full_name"] = db_user["full_name"] or profile["full_name"]
        profile["initials"] = db_user["initials"] or profile["initials"]
        profile["email"] = db_user["email"] or profile["email"]
        profile["institution"] = db_user["institution"] or profile["institution"]
        profile["phone"] = db_user["phone"] or profile["phone"]
        profile["job_title"] = db_user["job_title"] or profile["job_title"]
        profile["shift_schedule"] = db_user["shift_schedule"] or profile["shift_schedule"]
        profile["avatar_url"] = db_user["avatar_url"]

    token = create_access_token(
        {
            "sub": profile["username"],
            "user_id": profile["user_id"],
            "role_name": profile["role_name"],
            "role_key": profile["role_key"],
            "full_name": profile["full_name"],
            "initials": profile["initials"],
            "email": profile["email"],
        }
    )

    response.set_cookie(
        key="hera_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=43200,
    )

    await record_audit_log(
        conn=conn,
        actor_username=profile["username"],
        actor_user_id=profile["user_id"],
        action_type="LOGIN",
        resource_type="USER",
        resource_id=profile["username"],
        action_description=f"Autenticación de sesión SOC ({profile['role_name']})",
        details={"role": profile["role_name"], "role_key": profile["role_key"]},
    )

    return {
        "success": True,
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": profile,
        },
    }


@router.post("/logout")
async def logout(
    response: Response,
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    response.delete_cookie("hera_token")
    await record_audit_log(
        conn=conn,
        actor_username=user["username"],
        actor_user_id=user.get("user_id"),
        action_type="LOGOUT",
        resource_type="USER",
        resource_id=user["username"],
        action_description=f"Cierre de sesión SOC de {user['full_name']}",
        details={"role": user["role_name"]},
    )
    return {"success": True, "data": {"logged_out": True}}


@router.get("/me")
async def get_me(
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    profile = dict(user)
    db_user = await conn.fetchrow(
        "SELECT full_name, initials, email, institution, phone, job_title, shift_schedule, avatar_url FROM users WHERE user_id = $1",
        profile["user_id"],
    )
    if db_user:
        profile["full_name"] = db_user["full_name"] or profile["full_name"]
        profile["initials"] = db_user["initials"] or profile["initials"]
        profile["email"] = db_user["email"] or profile["email"]
        profile["institution"] = db_user["institution"] or profile.get("institution")
        profile["phone"] = db_user["phone"] or profile.get("phone")
        profile["job_title"] = db_user["job_title"] or profile.get("job_title")
        profile["shift_schedule"] = db_user["shift_schedule"] or profile.get("shift_schedule")
        profile["avatar_url"] = db_user["avatar_url"]
    return {"success": True, "data": profile}


@router.put("/profile")
async def update_profile(
    payload: UserProfileUpdateDTO,
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    parts = [p for p in payload.full_name.strip().split() if not p.endswith(".")]
    if len(parts) >= 2:
        initials = (parts[0][0] + parts[1][0]).upper()
    elif parts:
        initials = parts[0][:2].upper()
    else:
        initials = user.get("initials", "US")

    await conn.execute(
        """
        UPDATE users
        SET full_name = $1,
            initials = $2,
            email = $3,
            institution = $4,
            phone = $5,
            job_title = COALESCE($6, job_title),
            shift_schedule = COALESCE($7, shift_schedule),
            avatar_url = $8,
            updated_at = NOW()
        WHERE user_id = $9
        """,
        payload.full_name.strip(),
        initials,
        payload.email.strip(),
        payload.institution.strip(),
        payload.phone.strip(),
        payload.job_title.strip() if payload.job_title else None,
        payload.shift_schedule.strip() if payload.shift_schedule else None,
        payload.avatar_url,
        user["user_id"],
    )

    if user["role_key"] in ROLE_MAPPING:
        ROLE_MAPPING[user["role_key"]]["full_name"] = payload.full_name.strip()
        ROLE_MAPPING[user["role_key"]]["initials"] = initials
        ROLE_MAPPING[user["role_key"]]["email"] = payload.email.strip()
        ROLE_MAPPING[user["role_key"]]["institution"] = payload.institution.strip()
        ROLE_MAPPING[user["role_key"]]["phone"] = payload.phone.strip()
        if payload.job_title:
            ROLE_MAPPING[user["role_key"]]["job_title"] = payload.job_title.strip()
        if payload.shift_schedule:
            ROLE_MAPPING[user["role_key"]]["shift_schedule"] = payload.shift_schedule.strip()

    await record_audit_log(
        conn=conn,
        actor_username=user["username"],
        actor_user_id=user["user_id"],
        action_type="UPDATE",
        resource_type="USER",
        resource_id=user["username"],
        action_description=f"Actualización de configuración de cuenta de {payload.full_name.strip()}",
        details={
            "full_name": payload.full_name.strip(),
            "email": payload.email.strip(),
            "institution": payload.institution.strip(),
            "phone": payload.phone.strip(),
            "has_avatar": bool(payload.avatar_url),
        },
    )

    return await get_me(conn=conn, user=user)
