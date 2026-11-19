import asyncio
import os
import pytest
from httpx import ASGITransport, AsyncClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://heraueba:heraueba_secret_2026@localhost:5433/heraueba",
)

from app.core.database import close_db_pool, init_db_pool
from app.main import app
from app.seed import reset_demo_state


async def _run_with_fresh_db(coro_fn):
    await close_db_pool()
    pool = await init_db_pool()
    async with pool.acquire() as conn:
        await reset_demo_state(conn)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await coro_fn(client, pool)
    finally:
        await close_db_pool()


def test_t01_default_24h_alerts_filter():
    """T-01: Default alerts query returns strictly events within last 24 hours (FR-002)."""
    async def _test(client: AsyncClient, pool):
        # Default query (24h)
        res = await client.get("/api/v1/alerts")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert data["window_hours"] == 24
        alert_ids = [a["id"] for a in data["alerts"]]
        # The 5 alerts within 24h are returned, while INC-2026-0390 (10 days old) is excluded
        assert len(alert_ids) == 5
        assert "INC-2026-0417" in alert_ids
        assert "INC-2026-0390" not in alert_ids

        # Querying 30 days (720 hours) includes the historical alert INC-2026-0390
        res_30d = await client.get("/api/v1/alerts?window_hours=720")
        assert res_30d.status_code == 200
        ids_30d = [a["id"] for a in res_30d.json()["data"]["alerts"]]
        assert "INC-2026-0390" in ids_30d

    asyncio.run(_run_with_fresh_db(_test))


def test_t02_whitebox_decision_tree_path():
    """T-02: Decision tree endpoint returns ordered nodes with split conditions and observed values (FR-004)."""
    async def _test(client: AsyncClient, pool):
        res = await client.get("/api/v1/alerts/INC-2026-0417/decision-path")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        tree = body["data"]
        assert tree["alert_id"] == "INC-2026-0417"
        assert tree["verdict"] == "CREDENCIAL COMPROMETIDA"
        assert tree["auto_block_threshold"] == 0.98
        nodes = tree["nodes"]
        assert len(nodes) == 5
        # Verify strictly ordered node_index 1..5
        assert [n["node_index"] for n in nodes] == [1, 2, 3, 4, 5]
        assert nodes[0]["split_feature"] == "intentos_fallidos_15m"
        assert nodes[0]["observed_value"] == "14"
        assert nodes[0]["node_outcome"] == "CIERTO"
        assert nodes[4]["node_outcome"] == "COMPROBACIÓN"

    asyncio.run(_run_with_fresh_db(_test))


def test_t03_junior_role_isolation_forbidden_rbac():
    """T-03: Junior role attempting isolation receives HTTP 403 Forbidden (NFR-003)."""
    async def _test(client: AsyncClient, pool):
        # Authenticate as Junior Analyst
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "diego.fuentes", "password": "demo-pass-2026", "role": "junior"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["data"]["access_token"]

        res = await client.post(
            "/api/v1/actions/isolate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "mg.ramirez",
                "alert_id": "INC-2026-0417",
                "reason": "Intento de aislamiento desde cuenta de analista junior no autorizado.",
                "reauth_password": "demo-pass-2026",
                "confirmation_word": "AISLAR",
                "two_step_confirmed": True,
            },
        )
        assert res.status_code == 403
        err = res.json()
        assert err["success"] is False
        assert err["error"]["code"] == "RBAC_FORBIDDEN"

    asyncio.run(_run_with_fresh_db(_test))


def test_t04_coordinator_isolation_critical_unit_br002_violation():
    """T-04: Coordinator attempting isolation on ICU/OR/ER user receives HTTP 422 with BR-002 error (FR-007, BR-002)."""
    async def _test(client: AsyncClient, pool):
        # enf.castillo belongs to Urgencias (critical unit)
        res = await client.post(
            "/api/v1/actions/isolate",
            headers={"X-Hera-Role": "coordinador"},
            json={
                "username": "enf.castillo",
                "alert_id": "INC-2026-0418",
                "reason": "Credencial comprometida desde Países Bajos con dispositivo no registrado.",
                "reauth_password": "demo-pass-2026",
                "confirmation_word": "AISLAR",
                "two_step_confirmed": True,
            },
        )
        assert res.status_code == 422
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "BR_002_VIOLATION"
        assert "Urgencias" in body["error"]["message"]

        # Verify that the rejection was audited in quarantine_actions and audit_logs
        async with pool.acquire() as conn:
            q_row = await conn.fetchrow(
                "SELECT * FROM quarantine_actions WHERE blocked_due_to_critical_unit = TRUE ORDER BY action_id DESC LIMIT 1"
            )
            assert q_row is not None
            assert q_row["action_status"] == "REJECTED"

    asyncio.run(_run_with_fresh_db(_test))


def test_t05_coordinator_isolation_non_critical_succeeds_and_audits():
    """T-05: Coordinator isolation succeeds on non-critical user with two-step validation and logs audit (FR-005, FR-006, NFR-004)."""
    async def _test(client: AsyncClient, pool):
        # mg.ramirez belongs to Neurología (non-critical unit)
        res = await client.post(
            "/api/v1/actions/isolate",
            headers={"X-Hera-Role": "coordinador"},
            json={
                "username": "mg.ramirez",
                "alert_id": "INC-2026-0417",
                "reason": "Credencial comprometida confirmada: 14 intentos fallidos desde nodo Tor en Alemania.",
                "reauth_password": "demo-pass-2026",
                "confirmation_word": "AISLAR",
                "two_step_confirmed": True,
                "notify_clinical": True,
                "attach_evidence": True,
            },
        )
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert data["account_state"] == "AISLADA"
        assert data["action_status"] == "EXECUTED"
        assert data["two_step_confirmed"] is True
        assert data["simulated"] is True

        # Verify database state and audit log record
        async with pool.acquire() as conn:
            is_iso = await conn.fetchval(
                "SELECT is_isolated FROM users WHERE username = 'mg.ramirez'"
            )
            assert is_iso is True
            audit = await conn.fetchrow(
                "SELECT * FROM audit_logs WHERE log_id = $1", data["audit_log_id"]
            )
            assert audit is not None
            assert audit["actor_username"] == "carla.restrepo"
            assert audit["resource_type"] == "QUARANTINE"

        # Reset back to baseline so subsequent runs start clean
        async with pool.acquire() as conn:
            await reset_demo_state(conn)

    asyncio.run(_run_with_fresh_db(_test))


def test_t06_whitelist_validation_and_forensics():
    """T-06: Whitelist rejects invalid CIDR or missing expiration date (FR-008) & Forensics returns 180d history (FR-003)."""
    async def _test(client: AsyncClient, pool):
        # 1. Invalid CIDR
        bad_cidr = await client.post(
            "/api/v1/whitelist",
            headers={"X-Hera-Role": "coordinador"},
            json={
                "cidr": "invalid-cidr",
                "country": "Colombia",
                "scope": "Institucional",
                "end_date": "2027-06-30",
                "reason": "Enlace clínico de respaldo validado.",
                "audit_confirmed": True,
            },
        )
        assert bad_cidr.status_code == 422
        assert bad_cidr.json()["success"] is False

        # 2. Missing expiration date
        no_date = await client.post(
            "/api/v1/whitelist",
            headers={"X-Hera-Role": "coordinador"},
            json={
                "cidr": "192.168.44.0/24",
                "country": "Colombia",
                "scope": "Institucional",
                "end_date": "",
                "reason": "Enlace clínico de respaldo validado.",
                "audit_confirmed": True,
            },
        )
        assert no_date.status_code == 422

        # 3. Valid Whitelist Creation
        ok_wl = await client.post(
            "/api/v1/whitelist",
            headers={"X-Hera-Role": "coordinador"},
            json={
                "cidr": "192.168.44.0/24",
                "country": "Colombia",
                "scope": "Institucional",
                "end_date": "2027-06-30",
                "reason": "Enlace del nuevo hospital satélite de Chía.",
                "audit_confirmed": True,
            },
        )
        assert ok_wl.status_code == 200
        assert ok_wl.json()["data"]["cidr"] == "192.168.44.0/24"

        # 4. Forensics 180-day query for mg.ramirez returns > 24h events
        for_res = await client.get("/api/v1/forensics/users/mg.ramirez?window=full")
        assert for_res.status_code == 200
        fdata = for_res.json()["data"]
        assert fdata["retention_days"] == 180
        # Should include both the 6 recent events and the 2 historical events (total 8)
        assert fdata["events_count"] >= 8

        # Reset back to baseline
        async with pool.acquire() as conn:
            await reset_demo_state(conn)

    asyncio.run(_run_with_fresh_db(_test))


def test_t07_senior_role_and_profile_configuration():
    """T-07: Senior Analyst authentication and account profile update (PUT /api/v1/auth/profile)."""
    async def _test(client: AsyncClient, pool):
        # 1. Login as Senior Analyst
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "valeria.soto", "password": "demo-pass-2026", "role": "senior"},
        )
        assert login_res.status_code == 200
        user_data = login_res.json()["data"]["user"]
        assert user_data["role_key"] == "senior"
        assert user_data["role_name"] == "Analista Senior SOC"
        assert user_data["can_isolate"] is False

        # 2. Update profile as Coordinator
        upd_res = await client.put(
            "/api/v1/auth/profile",
            headers={"X-Hera-Role": "coordinador"},
            json={
                "full_name": "Carla Restrepo Gómez",
                "institution": "Hospital Universitario San Ignacio",
                "email": "carla.restrepo@husi.org.co",
                "phone": "+57 (601) 594 6161 ext. 104",
                "shift_schedule": "06:00–18:00 COT · Turno diurno",
                "avatar_url": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>",
            },
        )
        assert upd_res.status_code == 200
        upd_user = upd_res.json()["data"]
        assert upd_user["full_name"] == "Carla Restrepo Gómez"
        assert upd_user["institution"] == "Hospital Universitario San Ignacio"
        assert upd_user["email"] == "carla.restrepo@husi.org.co"
        assert upd_user["phone"] == "+57 (601) 594 6161 ext. 104"

        # Reset back to baseline
        async with pool.acquire() as conn:
            await reset_demo_state(conn)

    asyncio.run(_run_with_fresh_db(_test))

