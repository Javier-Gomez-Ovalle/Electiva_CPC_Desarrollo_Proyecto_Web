from typing import Any, Dict, Optional
import asyncpg
from fastapi import APIRouter, Depends, Query
from app.core.database import get_db
from app.core.security import RequireRole
from app.services.alert_service import (
    export_alert_stix,
    get_alert_detail,
    get_dashboard_kpis,
    get_decision_path,
    list_alerts,
)

router = APIRouter(tags=["Alerts & Dashboard"])

ALLOWED_READ_ROLES = ("Analista Junior SOC", "Analista Senior SOC", "Coordinador SOC", "CISO")


@router.get("/dashboard/kpis")
async def read_dashboard_kpis(
    window_hours: int = Query(default=24, ge=1, le=4320),
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    kpis = await get_dashboard_kpis(conn, window_hours=window_hours)
    return {"success": True, "data": kpis}


@router.get("/alerts")
async def read_alerts(
    window_hours: int = Query(default=24, ge=1, le=4320, description="FR-002: Default 24 hours"),
    severity: Optional[str] = Query(default=None),
    unit: Optional[str] = Query(default=None),
    country: Optional[str] = Query(default=None),
    risk: Optional[str] = Query(default=None),
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    alerts = await list_alerts(
        conn,
        window_hours=window_hours,
        severity=severity,
        unit=unit,
        country=country,
        risk=risk,
    )
    return {
        "success": True,
        "data": {
            "window_hours": window_hours,
            "count": len(alerts),
            "alerts": alerts,
        },
    }


@router.get("/alerts/{alert_id}")
async def read_alert_detail(
    alert_id: str,
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    detail = await get_alert_detail(conn, alert_id)
    return {"success": True, "data": detail}


@router.get("/alerts/{alert_id}/decision-path")
async def read_alert_decision_path(
    alert_id: str,
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    path = await get_decision_path(conn, alert_id)
    return {"success": True, "data": path}


@router.get("/alerts/{alert_id}/export")
async def export_alert(
    alert_id: str,
    conn: asyncpg.Connection = Depends(get_db),
    user: Dict[str, Any] = Depends(RequireRole(*ALLOWED_READ_ROLES)),
) -> Dict[str, Any]:
    package = await export_alert_stix(conn, alert_id, actor=user)
    return {"success": True, "data": package}
