from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field


# ---------- Place ----------

class PlaceBase(BaseModel):
    name: str
    type: str | None = None
    capacity: int = 1
    length_m: float | None = None
    price_per_night: Decimal = Field(default=Decimal("15.00"), ge=0)


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
    guest_street: str | None = None
    guest_postal_code: str | None = None
    guest_city: str | None = None
    nationality: str | None = None
    people_count: int = Field(default=0, ge=0)
    adult_count: int = Field(default=1, ge=0)
    child_count: int = Field(default=0, ge=0)
    day_visitor_count: int = Field(default=0, ge=0)
    has_electricity: bool = False
    has_waste: bool = False
    has_rhine_view: bool = False
    dog_count: int = Field(default=0, ge=0)
    car_count: int = Field(default=0, ge=0)
    motorcycle_count: int = Field(default=0, ge=0)
    camper_count: int = Field(default=0, ge=0)
    camper_length_m: float | None = Field(default=None, gt=0)
    tent_tariff_code: str | None = None
    place_price_per_night: Decimal | None = Field(default=None, ge=0)
    vehicle_size: str | None = None
    tent_count: int | None = None
    notes: str | None = None


class BookingCreate(BookingBase):
    place_id: int


class BookingUpdate(BaseModel):
    place_id: int
    start_date: date
    end_date: date
    guest_name: str
    guest_street: str | None = None
    guest_postal_code: str | None = None
    guest_city: str | None = None
    nationality: str | None = None
    people_count: int = Field(default=0, ge=0)
    adult_count: int = Field(default=1, ge=0)
    child_count: int = Field(default=0, ge=0)
    day_visitor_count: int = Field(default=0, ge=0)
    has_electricity: bool = False
    has_waste: bool = False
    has_rhine_view: bool = False
    dog_count: int = Field(default=0, ge=0)
    car_count: int = Field(default=0, ge=0)
    motorcycle_count: int = Field(default=0, ge=0)
    camper_count: int = Field(default=0, ge=0)
    camper_length_m: float | None = Field(default=None, gt=0)
    tent_tariff_code: str | None = None
    place_price_per_night: Decimal | None = Field(default=None, ge=0)
    vehicle_size: str | None = None
    tent_count: int | None = None
    notes: str | None = None


class BookingRead(BookingBase):
    id: int
    place_id: int
    booking_number: str | None = None
    status: str | None = None
    created_by: str | None = None

    class Config:
        from_attributes = True


class ReceiptGuest(BaseModel):
    name: str
    street: str | None = None
    postal_code: str | None = None
    city: str | None = None
    nationality: str | None = None


class ReceiptStay(BaseModel):
    start_date: date
    end_date: date
    nights: int


class ReceiptItem(BaseModel):
    description: str
    quantity: int
    unit: str
    tariff_code: str | None = None
    unit_price: Decimal
    total: Decimal


class ReceiptPlace(BaseModel):
    id: int
    name: str
    type: str | None = None


class ReceiptPrices(BaseModel):
    applied_tariff_codes: list[str]


class ReceiptBookingInfo(BaseModel):
    adult_count: int
    child_count: int
    day_visitor_count: int
    car_count: int
    motorcycle_count: int
    camper_count: int
    camper_length_m: float | None = None
    dog_count: int
    has_electricity: bool
    has_waste: bool
    has_rhine_view: bool
    vehicle_size: str | None = None
    notes: str | None = None
    created_by: str | None = None


class BookingReceiptRead(BaseModel):
    booking_id: int
    booking_number: str
    guest: ReceiptGuest
    stay: ReceiptStay
    place: ReceiptPlace
    booking_info: ReceiptBookingInfo
    prices: ReceiptPrices
    items: list[ReceiptItem]
    total: Decimal


class TariffBase(BaseModel):
    code: str
    label: str
    unit: str
    price: Decimal = Field(ge=0)
    valid_from: date
    valid_to: date | None = None


class TariffRead(TariffBase):
    id: int

    class Config:
        from_attributes = True


class BookingQuoteRequest(BookingBase):
    place_id: int
    place_name: str | None = None
    place_type: str | None = None


class BookingQuoteResponse(BaseModel):
    nights: int
    days: int
    items: list[ReceiptItem]
    total: Decimal

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

class UserRead(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class BackupFileRead(BaseModel):
    file_name: str
    size_bytes: int
    created_at: datetime


class BackupRestoreResponse(BaseModel):
    message: str
    restored_file: str
    safety_backup_file: str


