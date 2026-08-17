from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import models, schemas

MONEY_Q = Decimal("0.01")

DEFAULT_TARIFFS: list[dict] = [
    {"code": "visitor_day", "label": "Tagesbesucher", "unit": "Person/Tag", "price": Decimal("1.00")},
    {"code": "adult_night", "label": "Erwachsene", "unit": "Person/Nacht", "price": Decimal("6.00")},
    {"code": "child_night", "label": "Kinder bis 14 Jahre", "unit": "Kind/Nacht", "price": Decimal("3.50")},
    {"code": "dog_night", "label": "Hund", "unit": "Hund/Nacht", "price": Decimal("2.50")},
    {"code": "tent_basic", "label": "Zelt (Basis)", "unit": "Zelt/Nacht", "price": Decimal("4.00")},
    {"code": "tent_plus", "label": "Zelt (Gross)", "unit": "Zelt/Nacht", "price": Decimal("6.00")},
    {"code": "car_day", "label": "Auto", "unit": "Tag", "price": Decimal("2.50")},
    {"code": "motorcycle_day", "label": "Motorrad", "unit": "Tag", "price": Decimal("2.00")},
    {"code": "camper_lt6_day", "label": "Wohnmobil/Wohnwagen unter 6 m", "unit": "Tag", "price": Decimal("7.00")},
    {"code": "camper_6_8_day", "label": "Wohnmobil/Wohnwagen 6 bis 8 m", "unit": "Tag", "price": Decimal("8.00")},
    {"code": "camper_gt10_day", "label": "Wohnmobil/Wohnwagen ueber 10 m", "unit": "Tag", "price": Decimal("10.00")},
    {"code": "electricity_day", "label": "Strom", "unit": "Tag", "price": Decimal("4.00")},
    {"code": "waste_day", "label": "Muell", "unit": "Tag", "price": Decimal("1.00")},
    {"code": "rhine_view_once", "label": "Erste Reihe mit Rheinblick", "unit": "einmalig", "price": Decimal("3.00")},
]


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_Q, rounding=ROUND_HALF_UP)


def ensure_default_tariffs(db: Session):
    start = date(2020, 1, 1)

    for row in DEFAULT_TARIFFS:
        exists = db.query(models.Tariff).filter(models.Tariff.code == row["code"]).first()
        if exists is not None:
            continue

        db.add(
            models.Tariff(
                code=row["code"],
                label=row["label"],
                unit=row["unit"],
                price=row["price"],
                valid_from=start,
                valid_to=None,
            )
        )

    db.commit()


def get_active_tariffs(db: Session, on_date: date) -> dict[str, models.Tariff]:
    tariffs = (
        db.query(models.Tariff)
        .filter(
            models.Tariff.valid_from <= on_date,
            (models.Tariff.valid_to.is_(None) | (models.Tariff.valid_to >= on_date)),
        )
        .all()
    )
    return {tariff.code: tariff for tariff in tariffs}


def _require_tariff(tariffs: dict[str, models.Tariff], code: str) -> models.Tariff:
    tariff = tariffs.get(code)
    if tariff is None:
        raise HTTPException(status_code=500, detail=f"Tarif '{code}' ist nicht konfiguriert")
    return tariff


def _add_item(items: list[dict], description: str, quantity: int, unit: str, unit_price: Decimal, tariff_code: str | None = None):
    if quantity <= 0:
        return

    total = money(unit_price * Decimal(quantity))
    items.append(
        {
            "description": description,
            "quantity": quantity,
            "unit": unit,
            "unit_price": money(unit_price),
            "total": total,
            "tariff_code": tariff_code,
        }
    )


def _camper_tariff_code(length_m: float | None) -> str:
    if length_m is None or length_m <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuer Wohnmobil/Wohnwagen muss eine gueltige Fahrzeuglaenge angegeben werden.",
        )

    if length_m < 6:
        return "camper_lt6_day"
    if length_m <= 8:
        return "camper_6_8_day"
    if length_m > 10:
        return "camper_gt10_day"

    raise HTTPException(
        status_code=400,
        detail="Tarif fuer Fahrzeuglaenge zwischen 8 m und 10 m ist derzeit nicht definiert.",
    )


def _parse_vehicle_size_length(vehicle_size: str | None) -> float | None:
    if vehicle_size is None or vehicle_size.strip() == "":
        return None

    normalized = vehicle_size.lower().replace("m", "").replace(",", ".").strip()
    try:
        parsed = float(normalized)
    except ValueError:
        return None

    return parsed if parsed > 0 else None


def build_quote(
    booking: schemas.BookingCreate | schemas.BookingUpdate | schemas.BookingQuoteRequest,
    place: models.Place,
    tariffs: dict[str, models.Tariff],
):
    nights = (booking.end_date - booking.start_date).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="Abreise muss nach Anreise liegen")

    days = nights
    items: list[dict] = []

    place_price = money(Decimal(str(booking.place_price_per_night or place.price_per_night or 0)))
    _add_item(
        items,
        description=f"{place.type or 'Stellplatz'} Platz {place.name}",
        quantity=nights,
        unit="Nacht",
        unit_price=place_price,
        tariff_code="place_price_per_night",
    )

    adult_count = max(0, booking.adult_count)
    child_count = max(0, booking.child_count)
    day_visitor_count = max(0, booking.day_visitor_count)

    if adult_count + child_count == 0 and booking.people_count > 0:
        adult_count = booking.people_count

    adult_tariff = _require_tariff(tariffs, "adult_night")
    child_tariff = _require_tariff(tariffs, "child_night")
    visitor_tariff = _require_tariff(tariffs, "visitor_day")

    _add_item(items, adult_tariff.label, adult_count * nights, adult_tariff.unit, Decimal(str(adult_tariff.price)), adult_tariff.code)
    _add_item(items, child_tariff.label, child_count * nights, child_tariff.unit, Decimal(str(child_tariff.price)), child_tariff.code)
    _add_item(items, visitor_tariff.label, day_visitor_count * days, visitor_tariff.unit, Decimal(str(visitor_tariff.price)), visitor_tariff.code)

    if booking.dog_count > 0:
        dog_tariff = _require_tariff(tariffs, "dog_night")
        _add_item(items, dog_tariff.label, booking.dog_count * nights, dog_tariff.unit, Decimal(str(dog_tariff.price)), dog_tariff.code)

    if booking.car_count > 0:
        car_tariff = _require_tariff(tariffs, "car_day")
        _add_item(items, car_tariff.label, booking.car_count * days, car_tariff.unit, Decimal(str(car_tariff.price)), car_tariff.code)

    if booking.motorcycle_count > 0:
        mc_tariff = _require_tariff(tariffs, "motorcycle_day")
        _add_item(items, mc_tariff.label, booking.motorcycle_count * days, mc_tariff.unit, Decimal(str(mc_tariff.price)), mc_tariff.code)

    if booking.camper_count > 0:
        camper_length = booking.camper_length_m or _parse_vehicle_size_length(booking.vehicle_size)
        code = _camper_tariff_code(camper_length)
        camper_tariff = _require_tariff(tariffs, code)
        _add_item(items, camper_tariff.label, booking.camper_count * days, camper_tariff.unit, Decimal(str(camper_tariff.price)), camper_tariff.code)

    if (booking.tent_count or 0) > 0:
        if not booking.tent_tariff_code:
            raise HTTPException(status_code=400, detail="Bitte einen Zelt-Tarif auswaehlen.")

        tent_tariff = _require_tariff(tariffs, booking.tent_tariff_code)
        if not tent_tariff.code.startswith("tent_"):
            raise HTTPException(status_code=400, detail="Ungueltiger Zelt-Tarif.")

        tent_count_value = booking.tent_count or 0
        _add_item(
            items,
            tent_tariff.label,
            tent_count_value * nights,
            tent_tariff.unit,
            Decimal(str(tent_tariff.price)),
            tent_tariff.code,
        )

    if booking.has_electricity:
        power_tariff = _require_tariff(tariffs, "electricity_day")
        _add_item(items, power_tariff.label, days, power_tariff.unit, Decimal(str(power_tariff.price)), power_tariff.code)

    if booking.has_waste:
        waste_tariff = _require_tariff(tariffs, "waste_day")
        _add_item(items, waste_tariff.label, days, waste_tariff.unit, Decimal(str(waste_tariff.price)), waste_tariff.code)

    if booking.has_rhine_view:
        view_tariff = _require_tariff(tariffs, "rhine_view_once")
        _add_item(items, view_tariff.label, 1, view_tariff.unit, Decimal(str(view_tariff.price)), view_tariff.code)

    total = money(sum((Decimal(str(row["total"])) for row in items), start=Decimal("0.00")))

    tariff_snapshot = [
        {
            "code": tariff.code,
            "label": tariff.label,
            "unit": tariff.unit,
            "price": str(money(Decimal(str(tariff.price)))),
            "valid_from": tariff.valid_from.isoformat(),
            "valid_to": tariff.valid_to.isoformat() if tariff.valid_to else None,
        }
        for tariff in tariffs.values()
    ]

    return {
        "nights": nights,
        "days": days,
        "items": items,
        "total": total,
        "snapshot": {
            "tariffs": tariff_snapshot,
            "items": [
                {
                    **row,
                    "unit_price": str(row["unit_price"]),
                    "total": str(row["total"]),
                }
                for row in items
            ],
            "total": str(total),
        },
    }



