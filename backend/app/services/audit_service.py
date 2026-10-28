import json
from typing import Any, Dict, Optional
import asyncpg


async def record_audit_log(
    conn: asyncpg.Connection,
    actor_username: str,
    actor_user_id: Optional[int],
    action_type: str,
    resource_type: str,
    resource_id: str,
    action_description: str,
    details: Optional[Dict[str, Any]] = None,
    client_ip: str = "10.20.0.5",
    user_agent: str = "HeraUEBA-SOC-Console/1.0",
    success: bool = True,
    failure_reason: Optional[str] = None,
) -> int:
    row = await conn.fetchrow(
        """
        INSERT INTO audit_logs (
            actor_username, actor_user_id, action_type, resource_type, resource_id,
            action_description, details, client_ip, user_agent, success, failure_reason
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
        RETURNING log_id
        """,
        actor_username,
        actor_user_id,
        action_type,
        resource_type,
        resource_id,
        action_description,
        json.dumps(details or {}, ensure_ascii=False),
        client_ip,
        user_agent,
        success,
        failure_reason,
    )
    return int(row["log_id"])
