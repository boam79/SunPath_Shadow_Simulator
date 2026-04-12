"""통합 API 스모크 테스트 (실제 계산 수행)."""

MINIMAL_BODY = {
    "location": {"lat": 37.5665, "lon": 126.9780, "altitude": 0},
    "datetime": {
        "date": "2025-06-21",
        "start_time": "12:00",
        "end_time": "12:00",
        "interval": 60,
    },
    "object": {"height": 10},
    "options": {"atmosphere": True, "precision": "high"},
}


def test_integrated_calculate_v1(client):
    r = client.post("/api/v1/integrated/calculate", json=MINIMAL_BODY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "series" in data
    assert len(data["series"]) >= 1
    assert "summary" in data


def test_integrated_calculate_legacy_alias(client):
    r = client.post("/api/integrated/calculate", json=MINIMAL_BODY)
    assert r.status_code == 200, r.text
    assert "series" in r.json()


def test_rate_limit_headers_on_success(client):
    r = client.post("/api/v1/integrated/calculate", json=MINIMAL_BODY)
    assert r.status_code == 200
    assert "x-request-id" in {k.lower() for k in r.headers.keys()}
