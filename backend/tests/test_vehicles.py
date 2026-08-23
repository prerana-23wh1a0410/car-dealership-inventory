from fastapi.testclient import TestClient
from main import app
from models import User
from database import SessionLocal
from auth import hash_password

client = TestClient(app)

def get_auth_headers():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "Test1234"
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }




def test_add_vehicle():
    response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "Toyota",
            "model": "Camry",
            "category": "Sedan",
            "price": 25000,
            "quantity": 5
        }
    )

    assert response.status_code == 201
    data = response.json()

    assert data["make"] == "Toyota"
    assert data["model"] == "Camry"
    assert data["category"] == "Sedan"
    assert data["price"] == 25000
    assert data["quantity"] == 5

def test_get_all_vehicles():
    response = client.get("/api/vehicles")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1

def test_search_vehicles_by_make():
    response = client.get(
        "/api/vehicles/search",
        params={"make": "Toyota"}
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["make"] == "Toyota"
def test_update_vehicle():
    response = client.put(
        "/api/vehicles/1",
        json={
            "make": "Toyota",
            "model": "Camry Hybrid",
            "category": "Sedan",
            "price": 28000,
            "quantity": 7
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["model"] == "Camry Hybrid"
    assert data["price"] == 28000
    assert data["quantity"] == 7

def test_delete_vehicle():
    create_admin_user()
    create_response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "Ford",
            "model": "Focus",
            "category": "Hatchback",
            "price": 18000,
            "quantity": 3
        }
    )

    assert create_response.status_code == 201

    vehicle_id = create_response.json()["id"]

    response = client.delete(
        f"/api/vehicles/{vehicle_id}",
        headers=get_admin_headers()
    )

    assert response.status_code == 204

def test_purchase_vehicle():
    create_response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "Honda",
            "model": "City",
            "category": "Sedan",
            "price": 20000,
            "quantity": 5
        }
    )

    assert create_response.status_code == 201

    vehicle_id = create_response.json()["id"]

    response = client.post(
        f"/api/vehicles/{vehicle_id}/purchase",
        headers=get_auth_headers()
    )
    

    assert response.status_code == 200

    data = response.json()

    assert data["quantity"] == 4

def test_restock_vehicle():
    create_admin_user()
    create_response = client.post(
        "/api/vehicles",
        headers=get_admin_headers(),
        json={
            "make": "Hyundai",
            "model": "Creta",
            "category": "SUV",
            "price": 22000,
            "quantity": 2
        }
    )

    assert create_response.status_code == 201

    vehicle_id = create_response.json()["id"]

    response = client.post(
        f"/api/vehicles/{vehicle_id}/restock",
        headers=get_admin_headers(),
        json={"quantity": 3}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["quantity"] == 5

def test_update_vehicle():
    create_response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "Toyota",
            "model": "Camry",
            "category": "Sedan",
            "price": 25000,
            "quantity": 5
        }
    )

    assert create_response.status_code == 201

    vehicle_id = create_response.json()["id"]

    response = client.put(
        f"/api/vehicles/{vehicle_id}",
        headers=get_auth_headers(),
        json={
            "make": "Toyota",
            "model": "Camry Hybrid",
            "category": "Sedan",
            "price": 28000,
            "quantity": 7
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["model"] == "Camry Hybrid"
    assert data["price"] == 28000
    assert data["quantity"] == 7

    def test_add_vehicle_requires_authentication():
        response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "BMW",
            "model": "X5",
            "category": "SUV",
            "price": 60000,
            "quantity": 2
        }
    )

        assert response.status_code == 403
def get_admin_headers():
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@example.com",
            "password": "Admin1234"
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }

def create_admin_user():
    db = SessionLocal()

    existing_admin = db.query(User).filter(
        User.email == "admin@example.com"
    ).first()

    if existing_admin:
        existing_admin.role = "admin"
        existing_admin.password = hash_password("Admin1234")
    else:
        admin = User(
            email="admin@example.com",
            password=hash_password("Admin1234"),
            role="admin"
        )
        db.add(admin)

    db.commit()
    db.close()

def test_customer_cannot_restock_vehicle():
    create_response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "Kia",
            "model": "Seltos",
            "category": "SUV",
            "price": 24000,
            "quantity": 2
        }
    )

    assert create_response.status_code == 201

    vehicle_id = create_response.json()["id"]

    response = client.post(
        f"/api/vehicles/{vehicle_id}/restock",
        headers=get_auth_headers(),
        json={
            "quantity": 3
        }
    )

    assert response.status_code == 403

def test_customer_cannot_delete_vehicle():
    create_response = client.post(
        "/api/vehicles",
        headers=get_auth_headers(),
        json={
            "make": "Tata",
            "model": "Nexon",
            "category": "SUV",
            "price": 18000,
            "quantity": 2
        }
    )

    assert create_response.status_code == 201

    vehicle_id = create_response.json()["id"]

    response = client.delete(
        f"/api/vehicles/{vehicle_id}",
        headers=get_auth_headers()
    )

    assert response.status_code == 403
