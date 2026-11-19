"""Pruebas unitarias para el Árbol de Decisión (Caja Blanca · FR-004) de HeraUEBA."""

from app.services.decision_tree import AuthEventFeatures, evaluate_decision_tree

VALID_OUTCOMES = {"CIERTO", "FALSO", "COMPROBACIÓN", "BR-002"}
VALID_UI_VERDICTS = {"true", "false", "verify", "block"}


def _assert_heraueba_contract(res: dict):
    assert res["model_type"] == "DECISION_TREE"
    assert res["auto_block_threshold"] == 0.98
    assert res["factor"] < res["auto_block_threshold"]  # BR-001
    assert res["br_001_auto_block_allowed"] is False

    nodes = res["nodes"]
    assert len(nodes) == 5
    assert [n["node_index"] for n in nodes] == [1, 2, 3, 4, 5]
    assert [n["node_id"] for n in nodes] == [f"node_0{i}" for i in range(1, 6)]
    for n in nodes:
        assert n["node_outcome"] in VALID_OUTCOMES
        assert n["v"] in VALID_UI_VERDICTS
    assert nodes[-1]["is_leaf"] is True


def test_brute_force_non_critical_unit_matches_inc_0417_pattern():
    features = AuthEventFeatures(
        alert_id="INC-2026-0417",
        username="mg.ramirez",
        ip_address="185.220.101.47",
        geo_country="Alemania",
        geo_cc="DE",
        asn="ASN 60729 · Tor Exit Node Network",
        is_tor=True,
        failed_attempts_15m=14,
        attempt_window_min=1.4,
        mfa_enabled=False,
        auth_method="api_rest",
        unit_name="Neurología",
        unit_type="OTHER",
    )
    res = evaluate_decision_tree(features, active_whitelist_cidrs=["190.24.0.0/16", "10.20.0.0/16"])
    _assert_heraueba_contract(res)

    assert res["verdict"] == "CREDENCIAL COMPROMETIDA"
    assert res["severity"] == "CRÍTICO"
    assert res["nodes"][0]["split_feature"] == "intentos_fallidos_15m"
    assert res["nodes"][0]["node_outcome"] == "CIERTO"
    assert res["nodes"][4]["node_outcome"] == "COMPROBACIÓN"
    assert res["nodes"][4]["v"] == "verify"


def test_suspicious_asn_critical_unit_triggers_br002_block_node():
    features = AuthEventFeatures(
        alert_id="INC-2026-0418",
        username="enf.castillo",
        ip_address="45.132.192.10",
        geo_country="Países Bajos",
        geo_cc="NL",
        asn="ASN 9009 · M247 Europe SRL",
        unregistered_device=True,
        device_fingerprint="4f2a…9c1e",
        mfa_enabled=False,
        unit_name="Urgencias",
        unit_type="ER",
    )
    res = evaluate_decision_tree(features, active_whitelist_cidrs=["190.24.0.0/16"])
    _assert_heraueba_contract(res)

    assert res["verdict"] == "POSIBLE COMPROMISO DE CREDENCIAL"
    assert res["br_002_critical_unit_protected"] is True
    assert res["nodes"][0]["split_feature"] == "asn_origen"
    assert res["nodes"][4]["node_outcome"] == "BR-002"
    assert res["nodes"][4]["v"] == "block"


def test_admin_compromise_prior_failed_isolations_quirofano_br002():
    features = AuthEventFeatures(
        alert_id="INC-2026-0416",
        username="adm.sistema",
        ip_address="103.27.184.6",
        geo_country="Vietnam",
        geo_cc="VN",
        asn="ASN 45899 · VNPT Smart Cloud",
        prior_failed_isolations=3,
        clinical_write_privilege=True,
        mfa_enabled=False,
        unit_name="Quirófano",
        unit_type="OR",
    )
    res = evaluate_decision_tree(features, active_whitelist_cidrs=["190.24.0.0/16"])
    _assert_heraueba_contract(res)

    assert res["verdict"] == "COMPROMISO DE CUENTA ADMINISTRATIVA"
    assert res["incidence"] == "CRÍTICA"
    assert res["nodes"][0]["split_feature"] == "aislamiento_previo_fallido"
    assert res["nodes"][4]["node_outcome"] == "BR-002"
    assert res["nodes"][4]["v"] == "block"


def test_geovelocity_whitelisted_cidr_mitigates_false_positive():
    features = AuthEventFeatures(
        alert_id="INC-2026-0415",
        username="enf.mendoza",
        ip_address="181.60.72.14",
        geo_country="Panamá",
        geo_cc="PA",
        asn="ASN 26459 · Cable Panamá",
        geovelocity_kmh=950.0,
        concurrent_foreign_sessions=True,
        mfa_enabled=True,
        unit_name="Urgencias",
        unit_type="ER",
    )
    # 181.60.72.14 pertenece al CIDR 181.60.72.0/22 de whitelist_entries
    res = evaluate_decision_tree(features, active_whitelist_cidrs=["181.60.72.0/22"])
    _assert_heraueba_contract(res)

    assert res["verdict"] == "EXCEPCIÓN DE WHITELIST VALIDADA"
    assert res["severity"] == "SEGURO"
    assert res["factor"] == 0.22
    assert res["nodes"][1]["node_outcome"] == "FALSO"  # No está fuera de whitelist


def test_normal_local_hospital_access():
    features = AuthEventFeatures(
        alert_id="EVAL-LOCAL-001",
        username="mg.ramirez",
        ip_address="190.24.11.5",
        geo_country="Colombia",
        geo_cc="CO",
        asn="ASN 3816 · Colombia Telecomunicaciones",
        mfa_enabled=True,
        unit_name="Neurología",
        unit_type="OTHER",
    )
    res = evaluate_decision_tree(features, active_whitelist_cidrs=["190.24.0.0/16"])
    _assert_heraueba_contract(res)

    assert res["verdict"] == "ACCESO LEGÍTIMO · SIN ANOMALÍAS"
    assert res["severity"] == "SEGURO"
    assert res["factor"] == 0.12
    assert res["nodes"][4]["leaf_class"] == "NORMAL"
