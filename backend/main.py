from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User
from schemas import UserCreate, UserResponse
from auth import hash_password

app = FastAPI(title="Car Dealership Inventory API")

Base.metadata.create_all(bind=engine)


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