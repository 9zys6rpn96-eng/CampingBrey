from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)  # Zelt, Wohnwagen, etc.

    bookings = relationship("Booking", back_populates="place")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(Integer, ForeignKey("places.id"))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    place = relationship("Place", back_populates="bookings")
