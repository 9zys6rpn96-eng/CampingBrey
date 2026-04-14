from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from . import models, schemas

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables if not exist
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/places", response_model=schemas.PlaceRead)
def create_place(place: schemas.PlaceCreate, db: Session = Depends(get_db)):
    db_place = models.Place(
        name=place.name,
        type=place.type,
        capacity=place.capacity
    )
    db.add(db_place)
    db.commit()
    db.refresh(db_place)
    return db_place


@app.post("/places/bulk", response_model=list[schemas.PlaceRead])
def create_places_bulk(places: list[schemas.PlaceCreate], db: Session = Depends(get_db)):
    db_places = []

    for place in places:
        db_place = models.Place(
            name=place.name,
            type=place.type,
            capacity=place.capacity
        )
        db.add(db_place)
        db_places.append(db_place)

    db.commit()

    for place in db_places:
        db.refresh(place)

    return db_places

@app.get("/places", response_model=list[schemas.PlaceRead])
def list_places(db: Session = Depends(get_db)):
    places = db.query(models.Place).all()
    return places

@app.put("/places/{place_id}", response_model=schemas.PlaceRead)
def update_place(place_id: int, updated: schemas.PlaceCreate, db: Session = Depends(get_db)):
    place = db.query(models.Place).filter(models.Place.id == place_id).first()

    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")

    place.name = updated.name
    place.type = updated.type
    place.capacity = updated.capacity

    db.commit()
    db.refresh(place)

    return place

@app.post("/bookings", response_model=schemas.BookingRead)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
    # prüfen, ob der Platz existiert
    place = db.query(models.Place).filter(models.Place.id == booking.place_id).first()
    if place is None:
        raise HTTPException(status_code=400, detail="Place not found")

    # prüfen, ob das Datum sinnvoll ist
    if booking.start_date >= booking.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )

    # prüfen, ob es eine Überschneidung mit bestehender Buchung gibt
    # prüfen, wie viele überlappende Buchungen es bereits gibt
    overlapping_bookings_count = (
        db.query(models.Booking)
        .filter(
            models.Booking.place_id == booking.place_id,
            booking.start_date < models.Booking.end_date,
            booking.end_date > models.Booking.start_date,
        )
        .count()
    )

    if overlapping_bookings_count >= place.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Place is full for this period ({overlapping_bookings_count}/{place.capacity} booked)"
        )

    db_booking = models.Booking(
        place_id=booking.place_id,
        start_date=booking.start_date,
        end_date=booking.end_date,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


@app.get("/bookings", response_model=list[schemas.BookingRead])
def list_bookings(db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).all()
    return bookings

@app.delete("/bookings/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()

    return {"message": "Booking deleted"}
