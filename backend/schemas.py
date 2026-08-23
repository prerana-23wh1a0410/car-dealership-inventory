from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)


class VehicleCreate(BaseModel):
    make: str
    model: str
    category: str
    price: int
    quantity: int


class VehicleResponse(VehicleCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)