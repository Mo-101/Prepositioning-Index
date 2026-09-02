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
    assert {"src": "api/index.py", "use": "@vercel/python"} in config["builds"]
    assert {"src": "api/tracking.ts", "use": "@vercel/node"} in config["builds"]
    assert config["routes"][0] == {"src": "/api/tracking", "dest": "api/tracking.ts"}
    assert config["routes"][-1] == {"src": "/(.*)", "dest": "api/index.py"}
