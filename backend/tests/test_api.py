from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_user():
    email = f"newparent-{uuid4().hex[:8]}@test.com"
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "123456",
            "name": "New Parent",
            "role": "PARENT",
            "phone": "+919900000000",
        },
    )
    assert response.status_code in (200, 201)
    body = response.json()
    assert "access_token" in body
    assert body["user"]["email"] == email


def test_login_user():
    email = f"newparent-{uuid4().hex[:8]}@test.com"
    client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "123456",
            "name": "New Parent",
            "role": "PARENT",
            "phone": "+919900000000",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "123456",
            "role": "PARENT",
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_prediction_endpoint_requires_auth():
    response = client.post(
        "/api/prediction",
        json={
            "child_id": 1,
            "answers": {"Q1": 0, "Q2": 1, "Q3": 2, "Q4": 1, "Q5": 0, "Q6": 2, "Q7": 3, "Q8": 1},
        },
    )
    assert response.status_code == 401
