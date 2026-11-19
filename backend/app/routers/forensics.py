from typing import Any, Dict
import asyncpg
from fastapi import APIRouter, Depends, Query
from app.core.database import get_db
from app.core.security import RequireRole
from app.services.whitelist_forensics_service import get_user_forensics

router = APIRouter(prefix="/forensics", tags=["Forensics & Data Lake"])

ALLOWED_READ_ROLES = ("Analista Junior SOC", "Analista Senior SOC", "Coordinador SOC", "CISO")


@router.get("/users/{username}")
async def read_user_forensics(
    username: str,
    window: str = Query(default="full", description="FR-003: 24h, 7d, 30d, or full (180d)"),
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    forensics = await get_user_forensics(conn, username=username, window=window)
    return {"success": True, "data": forensics}
