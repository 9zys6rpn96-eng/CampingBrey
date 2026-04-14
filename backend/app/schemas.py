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


# ---------- Booking ----------

class BookingBase(BaseModel):
    start_date: date
    end_date: date


class BookingCreate(BookingBase):
    place_id: int


class BookingRead(BookingBase):
    id: int
    place_id: int

    class Config:
        from_attributes = True