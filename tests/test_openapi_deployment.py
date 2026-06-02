import json
from pathlib import Path

from api.index import handler
from deepcal.api import app


def test_openapi_schema_has_described_deepcal_fields() -> None:
    schema = app.openapi()
    components = schema["components"]["schemas"]

    assert components["HealthResult"]["properties"]["status"]["description"]
    assert components["ReadinessInput"]["properties"]["inventory_coverage"]["description"]
    assert components["GreyRankRequest"]["properties"]["matrix"]["description"]
    assert components["DecisionRankRequest"]["properties"]["uncertainty_triples"]["description"]
    assert components["NeutrosophicTriple"]["properties"]["truth"]["description"]
    assert components["DecisionRankResult"]["properties"]["scores"]["description"]


def test_vercel_routes_backend_traffic_to_python_entrypoint() -> None:
    config = json.loads(Path("vercel.json").read_text())

    assert handler is app
    assert config["builds"] == [{"src": "api/index.py", "use": "@vercel/python"}]
    assert config["routes"] == [{"src": "/(.*)", "dest": "api/index.py"}]
