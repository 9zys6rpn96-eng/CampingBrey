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


def ensure_default_places():
    db = SessionLocal()
    try:
        existing_ids = {
            place.id for place in db.query(models.Place).all()
        }

        for number in range(1, 105):
            if number in existing_ids:
                continue

            place = models.Place(
                name=str(number),
                type="Stellplatz",
                capacity=1,
            )
            db.add(place)

        db.commit()
    finally:
        db.close()


ensure_default_users()
ensure_default_places()


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


def require_authenticated_user(
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["developer", "operator", "user"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    return current_user

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

    if place.type == "Gesperrt":
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
            "status": "blocked",
        }
    total_days = (end_date - start_date).days + 1
    max_occupancy = 0
    occupied_days = 0
    fully_booked_days = 0

    for day_offset in range(total_days):
        current_day = start_date + timedelta(days=day_offset)

        occupancy = 0

        for booking in bookings:
            if booking.start_date <= current_day < booking.end_date:
                if place.type == "Zeltwiese":
                    occupancy += booking.tent_count or 1
                else:
                    occupancy += 1

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
    requested_units: int = 1,
) -> bool:
    total_days = (end_date - start_date).days

    for day_offset in range(total_days):
        current_day = start_date + timedelta(days=day_offset)
        occupancy = 0

        for existing_booking in existing_bookings:
            if (
                existing_booking.start_date
                <= current_day
                < existing_booking.end_date
            ):
                if place.type == "Zeltwiese":
                    occupancy += existing_booking.tent_count or 1
                else:
                    occupancy += 1

        if occupancy + requested_units > place.capacity:
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
    if user_data.role not in ["developer", "operator", "user"]:
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

@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: models.User = Depends(require_developer),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Du kannst deinen eigenen Account nicht löschen"
        )

    db.delete(user)
    db.commit()

    return {"message": "Benutzer gelöscht"}

@app.put("/bookings/{booking_id}", response_model=schemas.BookingRead)
def update_booking(
    booking_id: int,
    updated: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    booking = (
        db.query(models.Booking)
        .filter(models.Booking.id == booking_id)
        .first()
    )

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="Buchung nicht gefunden"
        )

    place = (
        db.query(models.Place)
        .filter(models.Place.id == updated.place_id)
        .first()
    )

    if place is None:
        raise HTTPException(
            status_code=404,
            detail="Platz nicht gefunden"
        )

    if updated.start_date >= updated.end_date:
        raise HTTPException(
            status_code=400,
            detail="Das Abreisedatum muss nach dem Anreisedatum liegen"
        )

    if not updated.guest_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Bitte einen Gastnamen eingeben"
        )

    if place.type in ["Dauercamper", "Gesperrt"]:
        raise HTTPException(
            status_code=400,
            detail="Dieser Platz kann nicht gebucht werden"
        )

    # Bei Stellplätzen Fahrzeuglänge prüfen
    if (
        place.type != "Zeltwiese"
        and updated.vehicle_size
        and place.length_m is not None
    ):
        try:
            vehicle_length = float(
                updated.vehicle_size
                .lower()
                .replace("m", "")
                .replace(",", ".")
                .strip()
            )

            if vehicle_length > place.length_m:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Das Fahrzeug ist zu lang. "
                        f"Dieser Platz ist maximal {place.length_m} m lang."
                    ),
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Bitte eine gültige Fahrzeuglänge eingeben"
            )

    # Die bearbeitete Buchung selbst nicht als Konflikt berücksichtigen
    overlapping_bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.place_id == updated.place_id,
            models.Booking.id != booking_id,
            updated.start_date < models.Booking.end_date,
            updated.end_date > models.Booking.start_date,
        )
        .all()
    )

    requested_units = (
        booking.tent_count or 1
        if place.type == "Zeltwiese"
        else 1
    )

    if place.type == "Zeltwiese":
        if booking.tent_count is None or booking.tent_count < 1:
            raise HTTPException(
                status_code=400,
                detail="Bitte die Anzahl der Zelte angeben"
            )

    if would_exceed_capacity(
        place=place,
        existing_bookings=overlapping_bookings,
        start_date=updated.start_date,
        end_date=updated.end_date,
    ):
        raise HTTPException(
            status_code=400,
            detail="Der Platz ist in diesem Zeitraum bereits voll belegt"
        )

    booking.place_id = updated.place_id
    booking.start_date = updated.start_date
    booking.end_date = updated.end_date
    booking.guest_name = updated.guest_name.strip()
    booking.vehicle_size = updated.vehicle_size
    booking.notes = updated.notes
    booking.tent_count = updated.tent_count

    db.commit()
    db.refresh(booking)

    return booking

@app.get("/users", response_model=list[schemas.UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_developer),
):
    users = db.query(models.User).order_by(models.User.username.asc()).all()
    return users

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
    current_user: models.User = Depends(require_authenticated_user),
):
    places = db.query(models.Place).all()
    return places


@app.get("/places/status", response_model=list[schemas.PlaceStatusRead])
def list_places_with_status(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Das Anreisedatum muss vor dem Abreisedatum liegen"
        )

    places = db.query(models.Place).all()

    # Fetch all bookings for date range in a single query (avoid N+1)
    all_bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.start_date <= end_date,
            models.Booking.end_date > start_date,
        )
        .all()
    )

    result = []
    for place in places:
        # Filter in-memory instead of additional DB queries
        overlapping_bookings = [
            b for b in all_bookings
            if b.place_id == place.id
        ]

        place_status = calculate_place_status_for_range(
            place=place,
            bookings=overlapping_bookings,
            start_date=start_date,
            end_date=end_date,
        )
        result.append(place_status)

    return result

@app.get("/places/available", response_model=list[schemas.PlaceRead])
def list_available_places(
    start_date: date,
    end_date: date,
    vehicle_length_m: float | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    if start_date >= end_date:
        raise HTTPException(
            status_code=400,
            detail="Das Anreisedatum muss vor dem Abreisedatum liegen"
        )

    places = db.query(models.Place).all()

    # Fetch all bookings for date range in a single query (avoid N+1)
    all_bookings = (
        db.query(models.Booking)
        .filter(
            models.Booking.start_date < end_date,
            models.Booking.end_date > start_date,
        )
        .all()
    )

    available_places = []

    for place in places:
        if place.type in ["Dauercamper", "Gesperrt"]:
            continue

        if vehicle_length_m is not None and place.length_m is not None:
            if vehicle_length_m > place.length_m:
                continue

        # Filter in-memory instead of additional DB queries
        overlapping_bookings = [
            b for b in all_bookings
            if b.place_id == place.id
        ]

        if would_exceed_capacity(
            place=place,
            existing_bookings=overlapping_bookings,
            start_date=start_date,
            end_date=end_date,
        ):
            continue

        available_places.append(place)

    return available_places

@app.put("/bookings/{booking_id}/noshow")
def mark_no_show(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    booking.status = "noshow"
    db.commit()

    return {"message": "Booking marked as no-show"}

@app.put("/places/{place_id}", response_model=schemas.PlaceRead)
def update_place(
    place_id: int,
    updated: schemas.PlaceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator_or_developer),
):
    place = db.query(models.Place).filter(models.Place.id == place_id).first()

    if place is None:
        raise HTTPException(status_code=404, detail="Platz nicht gefunden")

    place.name = updated.name
    place.type = updated.type
    place.capacity = updated.capacity
    place.length_m = updated.length_m

    db.commit()
    db.refresh(place)

    return place


@app.post("/bookings", response_model=schemas.BookingRead)
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    place = db.query(models.Place).filter(models.Place.id == booking.place_id).first()
    if place is None:
        raise HTTPException(status_code=400, detail="Platz nicht gefunden")

    if booking.start_date >= booking.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )

    if place.type in ["Dauercamper", "Gesperrt"]:
        raise HTTPException(
            status_code=400,
            detail="Dieser Platz kann nicht gebucht werden"
        )
    # Only perform vehicle length check for non-tent areas
    if (
        booking.vehicle_size and
        place.length_m and
        place.type != "Zeltwiese"
    ):
        try:
            vehicle_length = float(
                booking.vehicle_size.replace(" m", "").replace(",", ".")
            )

            if vehicle_length > place.length_m:
                raise HTTPException(
                    status_code=400,
                    detail=f"Fahrzeug zu lang. Maximal {place.length_m} m erlaubt."
                )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Bitte eine gültige Fahrzeuglänge eingeben."
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
        tent_count=booking.tent_count,
        notes=booking.notes,
        created_by=current_user.username,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking


@app.get("/bookings", response_model=list[schemas.BookingRead])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    bookings = db.query(models.Booking).all()
    return bookings


@app.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_authenticated_user),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if booking is None:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    db.delete(booking)
    db.commit()

    return {"message": "Booking deleted"}