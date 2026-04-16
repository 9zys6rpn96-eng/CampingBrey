from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)  # Zelt, Wohnwagen, etc.
    capacity = Column(Integer, nullable=False, default=1)
    bookings = relationship("Booking", back_populates="place")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    guest_name = Column(String, nullable=False)
    vehicle_size = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    place = relationship("Place", back_populates="bookings")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # developer | operator