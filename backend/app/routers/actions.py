from typing import Any, Dict
import asyncpg
from fastapi import APIRouter, Depends, Request
from app.core.database import get_db
from app.core.security import RequireRole
from app.schemas import IsolationRequestDTO
from app.services.isolation_service import execute_two_step_isolation

router = APIRouter(prefix="/actions", tags=["Mitigation & Quarantine"])


@router.post("/isolate")
async def isolate_account(
    payload: IsolationRequestDTO,
    request: Request,
    conn: asyncpg.Connection = Depends(get_db),
    operator: Dict[str, Any] = Depends(RequireRole("Coordinador SOC")),
) -> Dict[str, Any]:
    client_ip = request.client.host if request.client else "10.20.0.5"
    result = await execute_two_step_isolation(
        conn=conn,
        payload=payload,
        operator=operator,
        client_ip=client_ip,
    )
    return {"success": True, "data": result}
