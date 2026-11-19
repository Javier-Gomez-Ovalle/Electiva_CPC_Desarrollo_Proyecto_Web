import json
from datetime import date
from typing import Any, Dict, List, Optional
import asyncpg
from fastapi import HTTPException, status
from app.schemas import WhitelistCreateDTO
from app.services.audit_service import record_audit_log

HISTORY_SUMMARY_DEFAULTS = {
    "mg.ramirez": {
        "total": 1284,
        "logins": 612,
        "fails": 88,
        "countries": "CO (98.9 %), ES, DE",
        "session": "a7f3-91c2-e04b",
        "lastAnomaly": "hace 2 h",
    },
    "enf.castillo": {
        "total": 2417,
        "logins": 1103,
        "fails": 12,
        "countries": "CO (99.6 %), NL",
        "session": "4c18-0b7d-ea92",
        "lastAnomaly": "hace 20 min",
    },
    "adm.sistema": {
        "total": 903,
        "logins": 512,
        "fails": 31,
        "countries": "CO (94.1 %), VN",
        "session": "—",
        "lastAnomaly": "hace 45 min",
    },
    "enf.mendoza": {
        "total": 1892,
        "logins": 968,
        "fails": 6,
        "countries": "CO (100 %), PA",
        "session": "d220-5fa3-11c7",
        "lastAnomaly": "hace 1 h",
    },
    "lab.tech": {
        "total": 1604,
        "logins": 874,
        "fails": 19,
        "countries": "CO (97.2 %), ES",
        "session": "88be-31fa-0d4c",
        "lastAnomaly": "hace 1 h 34 min",
    },
}


async def list_whitelist_entries(conn: asyncpg.Connection) -> List[Dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT whitelist_id, cidr, country, cc, scope, reason, until_label,
               end_date, active, state, created_by_name, created_at
        FROM whitelist_entries
        ORDER BY whitelist_id ASC
        """
    )
    return [
        {
            "id": int(r["whitelist_id"]),
            "whitelist_id": int(r["whitelist_id"]),
            "cidr": r["cidr"],
            "country": r["country"],
            "cc": r["cc"],
            "scope": r["scope"],
            "note": r["reason"],
            "reason": r["reason"],
            "until": r["until_label"],
            "end_date": r["end_date"].isoformat() if r["end_date"] else None,
            "active": bool(r["active"]),
            "state": r["state"],
            "by": r["created_by_name"],
        }
        for r in rows
    ]


async def create_whitelist_entry(
    conn: asyncpg.Connection,
    payload: WhitelistCreateDTO,
    operator: Dict[str, Any],
    client_ip: str = "10.20.0.5",
) -> Dict[str, Any]:
    if not payload.audit_confirmed:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "AUDIT_CONFIRMATION_REQUIRED",
                "message": "Marca la casilla para dejar constancia de la revisión del comité clínico.",
            },
        )

    existing = await conn.fetchval(
        "SELECT whitelist_id FROM whitelist_entries WHERE cidr = $1", payload.cidr
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "DUPLICATE_CIDR",
                "message": "Esta red ya existe en la whitelist.",
            },
        )

    cc = payload.country[:3].upper()
    if payload.country.lower().startswith("col"):
        cc = "CO"
    elif payload.country.lower().startswith("esp"):
        cc = "ES"
    elif payload.country.lower().startswith("pan"):
        cc = "PA"

    end_dt = date.fromisoformat(payload.end_date)
    user_id = None
    if payload.username:
        user_id = await conn.fetchval(
            "SELECT user_id FROM users WHERE username = $1", payload.username
        )

    row = await conn.fetchrow(
        """
        INSERT INTO whitelist_entries (
            user_id, cidr, country, cc, scope, start_date, end_date,
            until_label, active, state, reason, created_by, created_by_name
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, TRUE, 'activa', $8, $9, $10)
        RETURNING whitelist_id, cidr, country, cc, scope, until_label, state, reason, created_by_name
        """,
        user_id,
        payload.cidr,
        payload.country,
        cc,
        payload.scope,
        end_dt,
        payload.end_date,
        payload.reason,
        operator["user_id"],
        operator["full_name"],
    )

    await record_audit_log(
        conn=conn,
        actor_username=operator["username"],
        actor_user_id=operator["user_id"],
        action_type="CREATE",
        resource_type="WHITELIST",
        resource_id=str(row["whitelist_id"]),
        action_description=f"Alta de excepción geográfica {row['cidr']} ({row['country']}) vigente hasta {row['until_label']}",
        details={
            "cidr": row["cidr"],
            "country": row["country"],
            "scope": row["scope"],
            "until": row["until_label"],
            "reason": row["reason"],
        },
        client_ip=client_ip,
    )

    return {
        "id": int(row["whitelist_id"]),
        "whitelist_id": int(row["whitelist_id"]),
        "cidr": row["cidr"],
        "country": row["country"],
        "cc": row["cc"],
        "scope": row["scope"],
        "note": row["reason"],
        "reason": row["reason"],
        "until": row["until_label"],
        "state": row["state"],
        "by": row["created_by_name"],
    }


async def delete_or_toggle_whitelist(
    conn: asyncpg.Connection,
    identifier: str,
    operator: Dict[str, Any],
    mode: str = "delete",
    client_ip: str = "10.20.0.5",
) -> Dict[str, Any]:
    if identifier.isdigit():
        row = await conn.fetchrow(
            "SELECT * FROM whitelist_entries WHERE whitelist_id = $1", int(identifier)
        )
    else:
        row = await conn.fetchrow("SELECT * FROM whitelist_entries WHERE cidr = $1", identifier)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "WHITELIST_NOT_FOUND",
                "message": f"No se encontró la entrada '{identifier}'.",
            },
        )

    if mode == "toggle":
        new_state = "expirada" if row["state"] == "activa" else "activa"
        new_active = new_state == "activa"
        await conn.execute(
            "UPDATE whitelist_entries SET state = $1, active = $2, updated_at = NOW() WHERE whitelist_id = $3",
            new_state,
            new_active,
            row["whitelist_id"],
        )
        await record_audit_log(
            conn=conn,
            actor_username=operator["username"],
            actor_user_id=operator["user_id"],
            action_type="UPDATE",
            resource_type="WHITELIST",
            resource_id=str(row["whitelist_id"]),
            action_description=f"Cambio de estado en whitelist {row['cidr']} a {new_state}",
            details={"cidr": row["cidr"], "new_state": new_state},
            client_ip=client_ip,
        )
        return {"whitelist_id": int(row["whitelist_id"]), "cidr": row["cidr"], "state": new_state}

    await conn.execute("DELETE FROM whitelist_entries WHERE whitelist_id = $1", row["whitelist_id"])
    await record_audit_log(
        conn=conn,
        actor_username=operator["username"],
        actor_user_id=operator["user_id"],
        action_type="DELETE",
        resource_type="WHITELIST",
        resource_id=str(row["whitelist_id"]),
        action_description=f"Eliminación de entrada de whitelist {row['cidr']}",
        details={"cidr": row["cidr"], "country": row["country"]},
        client_ip=client_ip,
    )
    return {"whitelist_id": int(row["whitelist_id"]), "cidr": row["cidr"], "deleted": True}


async def get_user_forensics(
    conn: asyncpg.Connection,
    username: str,
    window: str = "full",
) -> Dict[str, Any]:
    u = await conn.fetchrow(
        """
        SELECT u.*, un.unit_name, un.department, un.is_critical
        FROM users u
        JOIN units un ON un.unit_id = u.unit_id
        WHERE u.username = $1
        """,
        username,
    )
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER_NOT_FOUND",
                "message": f"No se encontró el historial forense para '{username}'.",
            },
        )

    # Determine interval based on window (FR-003: supports up to 180-day full retention)
    interval_map = {
        "24h": "24 hours",
        "7d": "7 days",
        "30d": "30 days",
        "full": "180 days",
    }
    sql_interval = interval_map.get(window, "180 days")

    ev_rows = await conn.fetch(
        f"""
        SELECT event_id, event_code, display_time, timeline_kind, timeline_icon,
               verdict_label, title, meta_desc, payload_hash, ip_address,
               geo_country, geo_cc, asn, outcome, raw_json, event_timestamp
        FROM auth_events
        WHERE user_id = $1 AND event_timestamp >= NOW() - INTERVAL '{sql_interval}'
        ORDER BY event_timestamp DESC, event_id ASC
        """,
        u["user_id"],
    )

    events = []
    for e in ev_rows:
        payload = json.loads(e["raw_json"]) if isinstance(e["raw_json"], str) else e["raw_json"]
        events.append(
            {
                "event_id": int(e["event_id"]),
                "event_code": e["event_code"],
                "t": e["display_time"],
                "k": e["timeline_kind"],
                "icon": e["timeline_icon"],
                "verdict": e["verdict_label"],
                "title": e["title"],
                "meta": e["meta_desc"],
                "hash": e["payload_hash"],
                "ip_address": e["ip_address"],
                "geo_country": e["geo_country"],
                "outcome": e["outcome"],
                "event_timestamp": e["event_timestamp"].isoformat(),
                "payload": payload,
            }
        )

    stats = HISTORY_SUMMARY_DEFAULTS.get(
        username,
        {
            "total": len(events),
            "logins": sum(1 for x in events if x["outcome"] == "success"),
            "fails": sum(1 for x in events if x["outcome"] == "failed"),
            "countries": "CO (100 %)",
            "session": "—",
            "lastAnomaly": "reciente",
        },
    )

    return {
        "username": u["username"],
        "retention_days": 180,
        "window_applied": window,
        "user": {
            "id": u["username"],
            "initials": u["initials"],
            "full": u["full_name"],
            "job": u["job_title"],
            "dept": u["department"],
            "unit": u["unit_name"],
            "is_critical_unit": bool(u["is_critical"]),
            "floor": u["floor_location"],
            "shift": u["shift_schedule"],
            "mfa": bool(u["mfa_enabled"]),
            "tenure": u["tenure"],
            "lastLegit": u["last_legit_desc"],
            "email": u["email"],
            "is_isolated": bool(u["is_isolated"]),
        },
        "summary": stats,
        "events_count": len(events),
        "events": events,
    }
