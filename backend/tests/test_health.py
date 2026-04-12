def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "healthy"


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "api_versions" in body
    assert "/api/v1" in body["api_versions"]
