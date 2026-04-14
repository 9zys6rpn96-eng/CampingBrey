from datetime import date
from typing import Optional

from pydantic import BaseModel


# ---------- Place ----------

class PlaceBase(BaseModel):
    name: str
    type: Optional[str] = None  # z.B. Wohnmobil, Zelt, etc.


class PlaceCreate(PlaceBase):
    pass


class PlaceRead(PlaceBase):
    id: int

    class Config:
        orm_mode = True


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
        orm_mode = True
