from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, Boolean, Numeric, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)  # Zelt, Wohnwagen, etc.
    capacity = Column(Integer, nullable=False, default=1)
    bookings = relationship("Booking", back_populates="place")
    length_m = Column(Float, nullable=True)
    price_per_night = Column(Numeric(10, 2), nullable=False, default=15.00)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id"))

    place = relationship("Place", back_populates="bookings")

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    guest_name = Column(String, nullable=False)
    booking_number = Column(String, nullable=True, unique=True, index=True)
    guest_street = Column(String, nullable=True)
    guest_postal_code = Column(String, nullable=True)
    guest_city = Column(String, nullable=True)
    people_count = Column(Integer, nullable=False, default=1)
    adult_count = Column(Integer, nullable=False, default=1)
    child_count = Column(Integer, nullable=False, default=0)
    day_visitor_count = Column(Integer, nullable=False, default=0)
    has_electricity = Column(Boolean, nullable=False, default=False)
    has_waste = Column(Boolean, nullable=False, default=False)
    has_rhine_view = Column(Boolean, nullable=False, default=False)
    dog_count = Column(Integer, nullable=False, default=0)
    car_count = Column(Integer, nullable=False, default=0)
    motorcycle_count = Column(Integer, nullable=False, default=0)
    camper_count = Column(Integer, nullable=False, default=0)
    camper_length_m = Column(Float, nullable=True)
    tent_tariff_code = Column(String, nullable=True)
    place_price_per_night = Column(Numeric(10, 2), nullable=False, default=15.00)
    pricing_snapshot = Column(JSON, nullable=True)
    billing_total = Column(Numeric(10, 2), nullable=True)
    vehicle_size = Column(String, nullable=True)
    tent_count = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(String, nullable=True)
    created_by = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # developer | operator


class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    label = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)
