from datetime import date
from pydantic import BaseModel


# ---------- Place ----------

class PlaceBase(BaseModel):
    name: str
    type: str | None = None
    capacity: int = 1


class PlaceCreate(PlaceBase):
    pass


class PlaceRead(PlaceBase):
    id: int

    class Config:
        from_attributes = True

class PlaceStatusRead(PlaceRead):
    start_date: date
    end_date: date
    max_occupancy: int
    occupied_days: int
    fully_booked_days: int
    status: str

    class Config:
        from_attributes = True


# ---------- Booking ----------

class BookingBase(BaseModel):
    start_date: date
    end_date: date
    guest_name: str
    vehicle_size: str | None = None
    notes: str | None = None


class BookingCreate(BookingBase):
    place_id: int


class BookingRead(BookingBase):
    id: int
    place_id: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: str


class UserCreatedResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True