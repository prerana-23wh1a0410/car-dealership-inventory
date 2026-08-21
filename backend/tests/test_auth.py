from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_user_can_register():
    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "password": "Test1234"
        }
    )

    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"