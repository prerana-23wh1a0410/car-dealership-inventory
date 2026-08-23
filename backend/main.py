from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User,Vehicle
from schemas import UserCreate, UserResponse, VehicleCreate,VehicleResponse
from auth import (hash_password, verify_password, create_access_token,get_current_user,require_admin)

app = FastAPI(title="Car Dealership Inventory API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://car-dealership-inventory-lovat.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
@app.post("/api/auth/create-admin")
def create_admin(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_admin = User(
        email=user.email,
        password=hash_password(user.password),
        role="admin"
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "message": "Admin created successfully",
        "email": new_admin.email,
        "role": new_admin.role
    }


@app.get("/")
def home():
    return {"message": "Car Dealership Inventory API is running!"}


@app.post("/api/auth/register", response_model=UserResponse, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        email=user.email,
        password=hash_password(user.password),
        role="customer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/api/auth/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(user.password, existing_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
    data={
        "sub": str(existing_user.id),
        "role": existing_user.role
    }
)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post(
    "/api/vehicles",
    response_model=VehicleResponse,
    status_code=201
)
def add_vehicle(
    vehicle: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    new_vehicle = Vehicle(
        make=vehicle.make,
        model=vehicle.model,
        category=vehicle.category,
        price=vehicle.price,
        quantity=vehicle.quantity
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle

@app.get("/api/vehicles", response_model=list[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(Vehicle).all()
    return vehicles

@app.get("/api/vehicles/search", response_model=list[VehicleResponse])
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)

    if make:
        query = query.filter(Vehicle.make.ilike(f"%{make}%"))

    if model:
        query = query.filter(Vehicle.model.ilike(f"%{model}%"))

    if category:
        query = query.filter(Vehicle.category.ilike(f"%{category}%"))

    if min_price is not None:
        query = query.filter(Vehicle.price >= min_price)

    if max_price is not None:
        query = query.filter(Vehicle.price <= max_price)

    return query.all()

@app.put(
    "/api/vehicles/{vehicle_id}",
    response_model=VehicleResponse
)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    vehicle.make = vehicle_data.make
    vehicle.model = vehicle_data.model
    vehicle.category = vehicle_data.category
    vehicle.price = vehicle_data.price
    vehicle.quantity = vehicle_data.quantity

    db.commit()
    db.refresh(vehicle)

    return vehicle

@app.delete("/api/vehicles/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db.delete(vehicle)
    db.commit()

    return None
@app.post(
    "/api/vehicles/{vehicle_id}/purchase",
    response_model=VehicleResponse
)
def purchase_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    if vehicle.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is out of stock"
        )

    vehicle.quantity -= 1

    db.commit()
    db.refresh(vehicle)

    return vehicle
@app.post(
    "/api/vehicles/{vehicle_id}/restock",
    response_model=VehicleResponse
)
def restock_vehicle(
    vehicle_id: int,
    restock_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    quantity = restock_data.get("quantity", 0)

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Restock quantity must be greater than 0"
        )

    vehicle.quantity += quantity

    db.commit()
    db.refresh(vehicle)

    return vehicle