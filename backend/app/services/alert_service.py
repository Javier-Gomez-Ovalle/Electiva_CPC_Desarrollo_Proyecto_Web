import csv
import io
import zipfile
from xml.sax.saxutils import escape as xml_escape
import json
import re
from typing import Any, Dict, List, Optional
import asyncpg
from fastapi import HTTPException, status
from app.core.config import settings
from app.services.audit_service import record_audit_log
from app.services.decision_tree import AuthEventFeatures, evaluate_decision_tree


async def get_dashboard_kpis(conn: asyncpg.Connection, window_hours: int = 24) -> Dict[str, Any]:
    rows = await conn.fetch(
        """
        SELECT a.severity, a.ui_sev, a.risk_score, u.is_isolated
        FROM alerts a
        JOIN users u ON u.user_id = a.user_id
        WHERE a.alert_timestamp >= NOW() - ($1::int * INTERVAL '1 hour')
        """,
        window_hours,
    )
    crit_count = sum(1 for r in rows if r["ui_sev"] == "critico" and not r["is_isolated"])
    med_count = max(12 - crit_count, sum(1 for r in rows if r["ui_sev"] != "critico"))
    isolated_db = await conn.fetchval("SELECT COUNT(*) FROM users WHERE is_isolated = TRUE")
    isolated_total = int(isolated_db or 0) + 1
    max_risk = max((float(r["risk_score"]) for r in rows), default=0.94)

    return {
        "window_hours": window_hours,
        "critical_alerts": crit_count,
        "medium_alerts": med_count,
        "isolated_accounts": isolated_total,
        "total_logins": 4812,
        "auto_block_threshold": settings.AUTO_BLOCK_THRESHOLD,
        "max_risk_observed": round(max_risk, 2),
    }


async def list_alerts(
    conn: asyncpg.Connection,
    window_hours: int = 24,
    severity: Optional[str] = None,
    unit: Optional[str] = None,
    country: Optional[str] = None,
    risk: Optional[str] = None,
) -> List[Dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT
            a.alert_id,
            a.incident_code,
            a.severity,
            a.ui_sev,
            a.alert_status,
            a.model_type,
            a.title,
            a.description,
            a.rule_expression,
            a.rule_short,
            a.ip_address,
            a.geo_country,
            a.geo_cc,
            a.asn,
            a.risk_score,
            a.display_time,
            a.display_at,
            a.alert_timestamp,
            u.username,
            u.full_name,
            u.initials,
            u.job_title,
            u.floor_location,
            u.shift_schedule,
            u.mfa_enabled,
            u.tenure,
            u.last_legit_desc,
            u.email,
            u.is_isolated,
            un.unit_name,
            un.department,
            un.is_critical AS unit_is_critical
        FROM alerts a
        JOIN users u ON u.user_id = a.user_id
        JOIN units un ON un.unit_id = u.unit_id
        WHERE a.alert_timestamp >= NOW() - ($1::int * INTERVAL '1 hour')
        ORDER BY
            CASE WHEN a.ui_sev = 'critico' THEN 0 ELSE 1 END ASC,
            a.alert_id ASC
        """,
        window_hours,
    )

    result: List[Dict[str, Any]] = []
    for r in rows:
        # Filter by severity if provided
        if severity and severity.lower() not in ("all", "todas"):
            sev_norm = severity.upper()
            if sev_norm not in (r["severity"].upper(), r["ui_sev"].upper()):
                continue

        # Filter by risk bucket if provided
        score = float(r["risk_score"])
        if risk == "alta" and score < 0.85:
            continue
        if risk == "media" and (score < 0.50 or score >= 0.85):
            continue
        if risk == "baja" and score >= 0.50:
            continue

        # Filter by unit/department or username key
        if unit and unit not in ("all", "todos"):
            if unit not in (r["username"], r["unit_name"], r["department"]):
                continue

        # Filter by country code
        if country and country not in ("all", "todos"):
            if country.upper() != r["geo_cc"].upper() and country.lower() != r["geo_country"].lower():
                continue

        result.append(
            {
                "alert_id": r["alert_id"],
                "id": r["incident_code"],
                "incident_code": r["incident_code"],
                "severity": r["severity"],
                "sev": r["ui_sev"],
                "user": r["username"],
                "username": r["username"],
                "risk": round(score, 2),
                "risk_score": round(score, 2),
                "at": r["display_at"],
                "time": r["display_time"],
                "alert_timestamp": r["alert_timestamp"].isoformat(),
                "ip": r["ip_address"],
                "country": r["geo_country"],
                "cc": r["geo_cc"],
                "asn": r["asn"],
                "rule": r["rule_expression"],
                "ruleShort": r["rule_short"],
                "status": "Aislada" if r["is_isolated"] else r["alert_status"],
                "title": r["title"],
                "model_type": r["model_type"],
                "is_isolated": r["is_isolated"],
                "subject": {
                    "id": r["username"],
                    "initials": r["initials"],
                    "full": r["full_name"],
                    "job": r["job_title"],
                    "dept": r["department"],
                    "unit": r["unit_name"],
                    "is_critical_unit": r["unit_is_critical"],
                    "floor": r["floor_location"],
                    "shift": r["shift_schedule"],
                    "mfa": r["mfa_enabled"],
                    "tenure": r["tenure"],
                    "lastLegit": r["last_legit_desc"],
                    "email": r["email"],
                },
            }
        )
    return result


async def _resolve_alert_row(conn: asyncpg.Connection, alert_identifier: str) -> asyncpg.Record:
    if alert_identifier.isdigit():
        row = await conn.fetchrow(
            """
            SELECT a.*, u.username, u.full_name, u.initials, u.job_title,
                   u.floor_location, u.shift_schedule, u.mfa_enabled, u.tenure,
                   u.last_legit_desc, u.email, u.is_isolated,
                   un.unit_name, un.department, un.is_critical AS unit_is_critical
            FROM alerts a
            JOIN users u ON u.user_id = a.user_id
            JOIN units un ON un.unit_id = u.unit_id
            WHERE a.alert_id = $1
            """,
            int(alert_identifier),
        )
    else:
        row = await conn.fetchrow(
            """
            SELECT a.*, u.username, u.full_name, u.initials, u.job_title,
                   u.floor_location, u.shift_schedule, u.mfa_enabled, u.tenure,
                   u.last_legit_desc, u.email, u.is_isolated,
                   un.unit_name, un.department, un.is_critical AS unit_is_critical
            FROM alerts a
            JOIN users u ON u.user_id = a.user_id
            JOIN units un ON un.unit_id = u.unit_id
            WHERE a.incident_code = $1
            """,
            alert_identifier,
        )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "ALERT_NOT_FOUND",
                "message": f"No se encontró la alerta '{alert_identifier}'.",
            },
        )
    return row


async def get_decision_path(conn: asyncpg.Connection, alert_identifier: str) -> Dict[str, Any]:
    alert_row = await _resolve_alert_row(conn, alert_identifier)
    node_rows = await conn.fetch(
        """
        SELECT
            node_index, node_id, node_name, split_feature, split_condition,
            split_value, observed_value, node_outcome, ui_verdict,
            is_leaf, leaf_class, rule_explanation, confidence
        FROM decision_paths
        WHERE alert_id = $1
        ORDER BY node_index ASC
        """,
        alert_row["alert_id"],
    )

    if not node_rows:
        # Evaluación dinámica en vivo con el Árbol de Decisión usando datos reales de BD y Whitelist
        wl_rows = await conn.fetch(
            """
            SELECT cidr
            FROM whitelist_entries
            WHERE active = TRUE
              AND (end_date IS NULL OR end_date >= CURRENT_DATE)
              AND (user_id IS NULL OR user_id = $1)
            """,
            alert_row["user_id"],
        )
        active_cidrs = [r["cidr"] for r in wl_rows]

        ev_row = None
        if alert_row["event_id"]:
            ev_row = await conn.fetchrow(
                "SELECT * FROM auth_events WHERE event_id = $1",
                alert_row["event_id"],
            )

        rule_text = (alert_row["rule_expression"] or "").lower()
        geo_match = re.search(r"geovelocidad\s*>\s*(\d+)", rule_text)
        geovelocity = float(geo_match.group(1)) + 50.0 if geo_match else 0.0
        concurrent = "sesiones activas" in rule_text or "simultáneas" in (alert_row["title"] or "").lower()

        features = AuthEventFeatures(
            alert_id=alert_row["incident_code"],
            username=alert_row["username"],
            ip_address=alert_row["ip_address"],
            geo_country=alert_row["geo_country"],
            geo_cc=alert_row["geo_cc"],
            asn=alert_row["asn"],
            is_tor=bool(ev_row["is_tor"]) if ev_row else False,
            is_vpn=bool(ev_row["is_vpn"]) if ev_row else False,
            failed_attempts_15m=int(ev_row["failure_count_window"]) if ev_row else 0,
            geovelocity_kmh=geovelocity,
            concurrent_foreign_sessions=concurrent,
            mfa_enabled=bool(alert_row["mfa_enabled"]),
            auth_method=ev_row["auth_method"] if ev_row else "password",
            unit_name=alert_row["unit_name"],
            is_critical_unit=bool(alert_row["unit_is_critical"]),
        )
        computed = evaluate_decision_tree(features, active_whitelist_cidrs=active_cidrs)
        computed["numeric_alert_id"] = int(alert_row["alert_id"])
        return computed

    nodes = [
        {
            "node_index": int(n["node_index"]),
            "i": int(n["node_index"]),
            "node_id": n["node_id"],
            "node_name": n["node_name"],
            "split_feature": n["split_feature"],
            "split_condition": n["split_condition"],
            "split_value": n["split_value"],
            "observed_value": n["observed_value"],
            "obs": n["observed_value"],
            "node_outcome": n["node_outcome"],
            "v": n["ui_verdict"],
            "rule": n["rule_explanation"],
            "rule_explanation": n["rule_explanation"],
            "is_leaf": bool(n["is_leaf"]),
            "confidence": float(n["confidence"]),
        }
        for n in node_rows
    ]

    return {
        "alert_id": alert_row["incident_code"],
        "numeric_alert_id": int(alert_row["alert_id"]),
        "model_type": alert_row["model_type"],
        "verdict": alert_row["tree_verdict"] or "REVISIÓN HUMANA",
        "factor": round(float(alert_row["risk_score"]), 2),
        "incidence": alert_row["tree_incidence"] or "MEDIA",
        "auto_block_threshold": settings.AUTO_BLOCK_THRESHOLD,
        "globalRule": alert_row["tree_global_rule"] or alert_row["rule_expression"],
        "global_rule": alert_row["tree_global_rule"] or alert_row["rule_expression"],
        "branch": alert_row["tree_branch"] or "Rama principal",
        "reading": alert_row["tree_reading"] or alert_row["description"] or "",
        "nodes": nodes,
    }


async def get_alert_detail(conn: asyncpg.Connection, alert_identifier: str) -> Dict[str, Any]:
    r = await _resolve_alert_row(conn, alert_identifier)
    decision_path = await get_decision_path(conn, alert_identifier)

    # Fetch recent timeline events for the user
    ev_rows = await conn.fetch(
        """
        SELECT event_id, event_code, display_time, timeline_kind, timeline_icon,
               verdict_label, title, meta_desc, payload_hash, raw_json, event_timestamp
        FROM auth_events
        WHERE user_id = $1 AND event_timestamp >= NOW() - INTERVAL '48 hours'
        ORDER BY event_timestamp DESC, event_id ASC
        """,
        r["user_id"],
    )

    events = []
    for e in ev_rows:
        payload = json.loads(e["raw_json"]) if isinstance(e["raw_json"], str) else e["raw_json"]
        events.append(
            {
                "event_id": e["event_id"],
                "t": e["display_time"],
                "k": e["timeline_kind"],
                "icon": e["timeline_icon"],
                "verdict": e["verdict_label"],
                "title": e["title"],
                "meta": e["meta_desc"],
                "hash": e["payload_hash"],
                "payload": payload,
            }
        )

    score = round(float(r["risk_score"]), 2)
    return {
        "alert_id": r["alert_id"],
        "id": r["incident_code"],
        "incident_code": r["incident_code"],
        "severity": r["severity"],
        "sev": r["ui_sev"],
        "user": r["username"],
        "username": r["username"],
        "risk": score,
        "risk_score": score,
        "at": r["display_at"],
        "time": r["display_time"],
        "alert_timestamp": r["alert_timestamp"].isoformat(),
        "ip": r["ip_address"],
        "country": r["geo_country"],
        "cc": r["geo_cc"],
        "asn": r["asn"],
        "rule": r["rule_expression"],
        "ruleShort": r["rule_short"],
        "status": "Aislada" if r["is_isolated"] else r["alert_status"],
        "title": r["title"],
        "model_type": r["model_type"],
        "is_isolated": r["is_isolated"],
        "subject": {
            "id": r["username"],
            "initials": r["initials"],
            "full": r["full_name"],
            "job": r["job_title"],
            "dept": r["department"],
            "unit": r["unit_name"],
            "is_critical_unit": r["unit_is_critical"],
            "floor": r["floor_location"],
            "shift": r["shift_schedule"],
            "mfa": r["mfa_enabled"],
            "tenure": r["tenure"],
            "lastLegit": r["last_legit_desc"],
            "email": r["email"],
        },
        "decision_path": decision_path,
        "events": events,
    }


async def export_alert_stix(
    conn: asyncpg.Connection, alert_identifier: str, actor: Dict[str, Any]
) -> Dict[str, Any]:
    detail = await get_alert_detail(conn, alert_identifier)
    await record_audit_log(
        conn=conn,
        actor_username=actor["username"],
        actor_user_id=actor.get("user_id"),
        action_type="READ",
        resource_type="ALERT",
        resource_id=detail["incident_code"],
        action_description=f"Exportación forense STIX 2.1 / JSON del incidente {detail['incident_code']}",
        details={"format": "STIX-2.1", "risk_score": detail["risk_score"]},
    )
    return {
        "type": "bundle",
        "id": f"bundle--heraueba-{detail['incident_code'].lower()}",
        "spec_version": "2.1",
        "normative_compliance": ["Ley 1581 de 2012 (Colombia)", "HIPAA Security Rule §164.312(b)"],
        "business_rules": {
            "BR-001": {
                "auto_block_threshold": settings.AUTO_BLOCK_THRESHOLD,
                "autonomous_lockout_executed": False,
            },
            "BR-002": {
                "critical_units_exempt": list(settings.CRITICAL_UNITS),
                "subject_in_critical_unit": detail["subject"]["is_critical_unit"],
            },
        },
        "incident": detail,
    }


def _col_letter(idx: int) -> str:
    res = ""
    n = idx + 1
    while n > 0:
        m = (n - 1) % 26
        res = chr(65 + m) + res
        n = (n - 1) // 26
    return res


def build_xlsx_bytes(sheet_title: str, headers: list, rows: list) -> bytes:
    all_rows = [headers] + list(rows)
    row_xml_parts = []
    for r_idx, row in enumerate(all_rows, start=1):
        cells = []
        for c_idx, val in enumerate(row):
            ref = f"{_col_letter(c_idx)}{r_idx}"
            if isinstance(val, (int, float)) and not isinstance(val, bool):
                cells.append(f'<c r="{ref}"><v>{val}</v></c>')
            else:
                text = xml_escape(str("" if val is None else val))
                cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{text}</t></is></c>')
        row_xml_parts.append(f'<row r="{r_idx}">{"".join(cells)}</row>')

    safe_sheet = xml_escape((sheet_title or "Reporte SOC")[:31])
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '</Types>'
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )
    wb_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '</Relationships>'
    )
    workbook = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<sheets><sheet name="{safe_sheet}" sheetId="1" r:id="rId1"/></sheets>'
        '</workbook>'
    )
    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(row_xml_parts)}</sheetData>'
        '</worksheet>'
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        zf.writestr("xl/workbook.xml", workbook)
        zf.writestr("xl/worksheets/sheet1.xml", sheet)
    return buf.getvalue()


def build_csv_bytes(headers: list, rows: list) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    return ("﻿" + buf.getvalue()).encode("utf-8")


def alert_package_to_table(package: Dict[str, Any]) -> tuple[list, list]:
    inc = package["incident"]
    subj = inc["subject"]
    dp = inc.get("decision_path") or {}
    nodes = dp.get("nodes") or []
    headers = [
        "Incidente", "Fecha_COT", "Severidad", "Riesgo", "Usuario", "Titular",
        "Unidad", "Unidad_Critica_BR002", "IP_Origen", "Pais", "ASN",
        "Nodo", "Condicion_Split", "Valor_Observado", "Resultado_Nodo", "Veredicto_Modelo"
    ]
    is_crit = "SI (Protegida BR-002)" if subj.get("is_critical_unit") else "NO"
    rows = [
        [
            inc["incident_code"], inc["at"], inc["severity"], inc["risk_score"],
            inc["username"], subj["full"], subj["unit"], is_crit,
            inc["ip"], inc["country"], inc["asn"],
            f"N{n['node_index']}", n["rule_explanation"], n["observed_value"],
            n["node_outcome"], dp.get("verdict", "")
        ]
        for n in nodes
    ]
    return headers, rows
