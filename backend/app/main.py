from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import date, timedelta
from .database import Base, engine, SessionLocal
from . import models, schemas
from .auth import verify_password, get_password_hash, create_access_token, decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI()

origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def ensure_default_users():
    db = SessionLocal()
    try:
        developer = db.query(models.User).filter(models.User.username == "developer").first()
        if developer is None:
            developer = models.User(
                username="developer",
                password_hash=get_password_hash("developer123"),
                role="developer",
            )
            db.add(developer)

        operator = db.query(models.User).filter(models.User.username == "operator").first()
        if operator is None:
            operator = models.User(
                username="operator",
                password_hash=get_password_hash("operator123"),
                role="operator",
            )
            db.add(operator)

        db.commit()
    finally:
        db.close()


ensure_default_users()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Ungültiger Token")

    username = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()

    if user is None:
        raise HTTPException(status_code=401, detail="User nicht gefunden")

    return user


def require_operator_or_developer(
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["developer", "operator"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    return current_user


def require_developer(
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "developer":
        raise HTTPException(status_code=403, detail="Developer-Zugriff erforderlich")
    return current_user


def calculate_place_status_for_range(
    place: models.Place,
    bookings: list[models.Booking],
    start_date: date,
    end_date: date,
):
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")

    if place.type == "Dauercamper":
        return {
            "id": place.id,
            "name": place.name,
            "type": place.type,
            "capacity": place.capacity,
            "start_date": start_date,
            "end_date": end_date,
            "max_occupancy": 0,
            "occupied_days": 0,
            "fully_booked_days": 0,
            "status": "gray",
        }

    total_days = (end_date - start_date).days + 1
    max_occupancy = 0
    occupied_days = 0
    fully_booked_days = 0

    for day_offset in range(total_days):
        current_day = start_date + timedelta(days=day_offset)

        occupancy = sum(
            1
            for booking in bookings
            if booking.start_date <= current_day < booking.end_date
        )

        if occupancy > 0:
            occupied_days += 1

        if occupancy >= place.capacity:
            fully_booked_days += 1

        if occupancy > max_occupancy:
            max_occupancy = occupancy

    if occupied_days == 0:
        status = "green"
    elif fully_booked_days > 0:
        status = "red"
    else:
        status = "yellow"

    return {
        "id": place.id,
        "name": place.name,
        "type": place.type,
        "capacity": place.capacity,
        "start_date": start_date,
        "end_date": end_date,
        "max_occupancy": max_occupancy,
        "occupied_days": occupied_days,
        "fully_booked_days": fully_booked_days,
        "status": status,
    }

def would_exceed_capacity(
    place: models.Place,
    existing_bookings: list[models.Booking],
    start_date: date,
    end_date: date,
) -> bool:
    total_days = (end_date - start_date).days

    for day_offset in range(total_days):
        current_day = start_date + timedelta(days=day_offset)

        occupancy = sum(
            1
            for existing_booking in existing_bookings
            if existing_booking.start_date <= current_day < existing_booking.end_date
        )

        if occupancy >= place.capacity:
            return True

    return False

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Falsche Login-Daten")

    token = create_access_token({
        "sub": user.username,
        "role": user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me")
def read_me(current_user: models.User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "role": current_user.role
    }

@app.post("/users", response_model=schemas.UserCreatedResponse)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_developer),
):
    if user_data.role not in ["developer", "operator"]:
        raise HTTPException(status_code=400, detail="Ungültige Rolle")

    existing_user = (
        db.query(models.User)
        .filter(models.User.username == user_data.username)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(status_code=400, detail="Benutzername existiert bereits")

    new_user = models.User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/places", response_model=schemas.PlaceRead)
def create_place(
    place: schemas.PlaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_developer),
):
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
def create_places_bulk(
    places: list[schemas.PlaceCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_developer),
):
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
def list_places(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
    places = db.query(models.Place).all()
    return places


@app.get("/places/status", response_model=list[schemas.PlaceStatusRead])
def list_places_with_status(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date"
        )

    places = db.query(models.Place).all()
    result = []

    for place in places:
        overlapping_bookings = (
            db.query(models.Booking)
            .filter(
                models.Booking.place_id == place.id,
                models.Booking.start_date <= end_date,
                models.Booking.end_date > start_date,
            )
            .all()
        )

        place_status = calculate_place_status_for_range(
            place=place,
            bookings=overlapping_bookings,
            start_date=start_date,
            end_date=end_date,
        )
        result.append(place_status)

    return result


@app.put("/places/{place_id}", response_model=schemas.PlaceRead)
def update_place(
    place_id: int,
    updated: schemas.PlaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
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
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
    place = db.query(models.Place).filter(models.Place.id == booking.place_id).first()
    if place is None:
        raise HTTPException(status_code=400, detail="Place not found")

    if booking.start_date >= booking.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )

    if place.type == "Dauercamper":
        raise HTTPException(
            status_code=400,
            detail="Dauercamper-Plätze können nicht gebucht werden"
        )

        overlapping_bookings = (
            db.query(models.Booking)
            .filter(
                models.Booking.place_id == booking.place_id,
                booking.start_date < models.Booking.end_date,
                booking.end_date > models.Booking.start_date,
            )
            .all()
        )

        if would_exceed_capacity(
                place=place,
                existing_bookings=overlapping_bookings,
                start_date=booking.start_date,
                end_date=booking.end_date,
        ):
            raise HTTPException(
                status_code=400,
                detail="Place is full for at least one day in this period"
            )

    db_booking = models.Booking(
        place_id=booking.place_id,
        start_date=booking.start_date,
        end_date=booking.end_date,
        guest_name=booking.guest_name,
        vehicle_size=booking.vehicle_size,
        notes=booking.notes,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


@app.get("/bookings", response_model=list[schemas.BookingRead])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
    bookings = db.query(models.Booking).all()
    return bookings


@app.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()

    return {"message": "Booking deleted"}