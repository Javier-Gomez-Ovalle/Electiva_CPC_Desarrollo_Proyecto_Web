from typing import Any, Dict
import asyncpg
from fastapi import APIRouter, Depends, Query, Request
from app.core.database import get_db
from app.core.security import RequireRole
from app.schemas import WhitelistCreateDTO
from app.services.whitelist_forensics_service import (
    create_whitelist_entry,
    delete_or_toggle_whitelist,
    list_whitelist_entries,
)

router = APIRouter(prefix="/whitelist", tags=["Geographic Whitelist"])

ALLOWED_READ_ROLES = ("Analista Junior SOC", "Analista Senior SOC", "Coordinador SOC", "CISO")


@router.get("")
async def get_whitelist(
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    entries = await list_whitelist_entries(conn)
    return {"success": True, "data": {"entries": entries, "count": len(entries)}}


@router.post("")
async def post_whitelist(
    payload: WhitelistCreateDTO,
    request: Request,
    conn: asyncpg.Connection = Depends(get_db),
    operator: Dict[str, Any] = Depends(RequireRole("Coordinador SOC")),
) -> Dict[str, Any]:
    client_ip = request.client.host if request.client else "10.20.0.5"
    created = await create_whitelist_entry(conn, payload, operator=operator, client_ip=client_ip)
    return {"success": True, "data": created}


@router.delete("/{entry_id:path}")
async def remove_whitelist(
    entry_id: str,
    request: Request,
    mode: str = Query(default="delete", pattern="^(delete|toggle)$"),
    conn: asyncpg.Connection = Depends(get_db),
    operator: Dict[str, Any] = Depends(RequireRole("Coordinador SOC")),
) -> Dict[str, Any]:
    client_ip = request.client.host if request.client else "10.20.0.5"
    result = await delete_or_toggle_whitelist(
        conn, identifier=entry_id, operator=operator, mode=mode, client_ip=client_ip
    )
    return {"success": True, "data": result}
