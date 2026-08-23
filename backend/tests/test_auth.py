import os

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_user_can_register():
    import uuid

    email = f"pytest_{uuid.uuid4().hex}@example.com"

    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "Test1234"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == email
    assert data["role"] == "customer"



def test_user_can_login():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "Test1234"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"