from typing import Any, Dict
import asyncpg
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import verify_password
from app.schemas import IsolationRequestDTO
from app.services.audit_service import record_audit_log


async def execute_two_step_isolation(
    conn: asyncpg.Connection,
    payload: IsolationRequestDTO,
    operator: Dict[str, Any],
    client_ip: str = "10.20.0.5",
) -> Dict[str, Any]:
    # 1. Lookup target user and unit
    user_row = await conn.fetchrow(
        """
        SELECT u.user_id, u.username, u.full_name, u.is_isolated,
               un.unit_id, un.unit_name, un.is_critical, un.unit_type, un.department
        FROM users u
        JOIN units un ON un.unit_id = u.unit_id
        WHERE u.username = $1
        """,
        payload.username,
    )
    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER_NOT_FOUND",
                "message": f"No se encontró la cuenta '{payload.username}'.",
            },
        )

    # Resolve optional alert_id
    alert_db_id = None
    if payload.alert_id:
        if str(payload.alert_id).isdigit():
            alert_db_id = int(payload.alert_id)
        else:
            alert_db_id = await conn.fetchval(
                "SELECT alert_id FROM alerts WHERE incident_code = $1", payload.alert_id
            )

    # 2. Enforce BR-002 / FR-007: Critical Unit Lockout Exemption (UCI, Quirófano, Urgencias)
    if user_row["is_critical"] or user_row["unit_name"] in settings.CRITICAL_UNITS:
        rejection_msg = (
            f"Regla de negocio BR-002 · Política de continuidad clínica: "
            f"No se puede aislar la cuenta '{user_row['username']}' porque pertenece a la unidad crítica "
            f"'{user_row['unit_name']}' ({user_row['department']}). El aislamiento por software está "
            f"prohibido en UCI, Quirófano y Urgencias."
        )
        # Persist rejected quarantine action for full regulatory audit trail (NFR-004)
        action_id = await conn.fetchval(
            """
            INSERT INTO quarantine_actions (
                user_id, alert_id, action_status, reason, requested_by,
                two_step_confirmed, blocked_due_to_critical_unit, rejection_reason, simulated
            )
            VALUES ($1, $2, 'REJECTED', $3, $4, $5, TRUE, $6, TRUE)
            RETURNING action_id
            """,
            user_row["user_id"],
            alert_db_id,
            payload.reason or "Intento de aislamiento sobre unidad crítica",
            operator["user_id"],
            bool(payload.two_step_confirmed),
            rejection_msg,
        )
        await record_audit_log(
            conn=conn,
            actor_username=operator["username"],
            actor_user_id=operator["user_id"],
            action_type="REJECT",
            resource_type="QUARANTINE",
            resource_id=str(action_id),
            action_description=rejection_msg,
            details={
                "rule": "BR-002",
                "target_user": user_row["username"],
                "unit_name": user_row["unit_name"],
                "unit_type": user_row["unit_type"],
            },
            client_ip=client_ip,
            success=False,
            failure_reason="BR_002_VIOLATION",
        )
        raise HTTPException(
            status_code=422,
            detail={
                "code": "BR_002_VIOLATION",
                "message": rejection_msg,
                "details": {
                    "rule": "BR-002",
                    "username": user_row["username"],
                    "unit": user_row["unit_name"],
                    "department": user_row["department"],
                    "critical_units": list(settings.CRITICAL_UNITS),
                    "audit_action_id": action_id,
                },
            },
        )

    # 3. Validate Step 1 & Step 2 requirements (FR-005, FR-006)
    reason_clean = (payload.reason or "").strip()
    if len(reason_clean) < 30:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_JUSTIFICATION",
                "message": "Describe el motivo en al menos 30 caracteres: es el texto que verá el jefe de servicio y el titular.",
            },
        )

    if not verify_password(payload.reauth_password, "demo-pass-2026"):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "REAUTH_FAILED",
                "message": "La re-autenticación no coincide con la contraseña de dominio.",
            },
        )

    if not payload.two_step_confirmed or (payload.confirmation_word or "").strip().upper() != "AISLAR":
        raise HTTPException(
            status_code=422,
            detail={
                "code": "TWO_STEP_CONFIRMATION_REQUIRED",
                "message": "Escribe literalmente AISLAR para habilitar la ejecución en dos pasos (FR-006).",
            },
        )

    # 4. Execute simulated isolation in database (BR-001: human-triggered, simulated=True)
    await conn.execute(
        "UPDATE users SET is_isolated = TRUE, updated_at = NOW() WHERE user_id = $1",
        user_row["user_id"],
    )
    if alert_db_id:
        await conn.execute(
            "UPDATE alerts SET alert_status = 'Aislada', updated_at = NOW() WHERE alert_id = $1",
            alert_db_id,
        )

    action_row = await conn.fetchrow(
        """
        INSERT INTO quarantine_actions (
            user_id, alert_id, action_status, reason, requested_by, approved_by,
            approved_at, two_step_confirmed, two_step_confirmed_at,
            blocked_due_to_critical_unit, simulated, executed_at
        )
        VALUES ($1, $2, 'EXECUTED', $3, $4, $4, NOW(), TRUE, NOW(), FALSE, TRUE, NOW())
        RETURNING action_id, executed_at
        """,
        user_row["user_id"],
        alert_db_id,
        reason_clean,
        operator["user_id"],
    )

    log_id = await record_audit_log(
        conn=conn,
        actor_username=operator["username"],
        actor_user_id=operator["user_id"],
        action_type="APPROVE",
        resource_type="QUARANTINE",
        resource_id=str(action_row["action_id"]),
        action_description=f"Cuenta {user_row['username']} aislada en simulación tras verificación de 2 pasos (FR-005/FR-006).",
        details={
            "target_user": user_row["username"],
            "unit": user_row["unit_name"],
            "reason": reason_clean,
            "two_step_confirmed": True,
            "simulated": True,
            "notify_clinical": payload.notify_clinical,
            "attach_evidence": payload.attach_evidence,
            "br_001_human_intervention": True,
        },
        client_ip=client_ip,
        success=True,
    )

    return {
        "action_id": int(action_row["action_id"]),
        "audit_log_id": log_id,
        "username": user_row["username"],
        "full_name": user_row["full_name"],
        "unit": user_row["unit_name"],
        "action_status": "EXECUTED",
        "account_state": "AISLADA",
        "two_step_confirmed": True,
        "simulated": True,
        "executed_by": operator["full_name"],
        "executed_at": action_row["executed_at"].isoformat(),
    }
