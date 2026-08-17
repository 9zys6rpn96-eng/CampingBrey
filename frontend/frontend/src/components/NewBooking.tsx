import { useEffect, useMemo, useState } from "react";
import type { Booking, BookingQuote, Place, Tariff } from "../types";
import { createBooking, fetchTariffs, quoteBooking, updatePlace } from "../services/api";

function formatEuro(value: number) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface NewBookingProps {
  place: Place;
  bookings: Booking[];
  initialStartDate?: string;
  initialEndDate?: string;
  initialVehicleLengthM?: string;
  onBookingCreated: () => void | Promise<void>;
  onBookingFinished?: () => void;
  canEditPlace?: boolean;
  onPlaceUpdated?: () => void | Promise<void>;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextWeekendRange() {
  const today = new Date();
  const day = today.getDay();

  const daysUntilFriday = day <= 5 ? 5 - day : 6;
  const friday = addDays(today, daysUntilFriday);
  const sunday = addDays(friday, 2);

  return {
    start: toIsoDate(friday),
    end: toIsoDate(sunday),
  };
}

function getNextWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

  const monday = addDays(today, daysUntilNextMonday);
  const nextMonday = addDays(monday, 7);

  return {
    start: toIsoDate(monday),
    end: toIsoDate(nextMonday),
  };
}

function getMaxOccupancyInRange(
  place: Place,
  bookings: Booking[],
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate || startDate >= endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  let maxOccupancy = 0;

  for (
    let current = new Date(start);
    current < end;
    current.setDate(current.getDate() + 1)
  ) {
    const currentIso = toIsoDate(current);

    const occupancy = bookings
      .filter(
        (booking) =>
          booking.start_date <= currentIso &&
          currentIso < booking.end_date
      )
      .reduce((sum, booking) => {
        if (place.type === "Zeltwiese") {
          return sum + (booking.tent_count ?? 1);
        }

        return sum + 1;
      }, 0);

    if (occupancy > maxOccupancy) {
      maxOccupancy = occupancy;
    }
  }

  return maxOccupancy;
}

export function NewBooking({
  place,
  bookings,
  initialStartDate = "",
  initialEndDate = "",
  initialVehicleLengthM = "",
  onBookingCreated,
  onBookingFinished,
  canEditPlace = false,
  onPlaceUpdated,
}: NewBookingProps) {
  const [guestName, setGuestName] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [vehicleSize, setVehicleSize] = useState("");
  const [tentCount, setTentCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [guestStreet, setGuestStreet] = useState("");
  const [guestPostalCode, setGuestPostalCode] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [adultCount, setAdultCount] = useState("1");
  const [childCount, setChildCount] = useState("0");
  const [dayVisitorCount, setDayVisitorCount] = useState("0");
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasWaste, setHasWaste] = useState(false);
  const [hasRhineView, setHasRhineView] = useState(false);
  const [dogCount, setDogCount] = useState("0");
  const [carCount, setCarCount] = useState("0");
  const [motorcycleCount, setMotorcycleCount] = useState("0");
  const [camperCount, setCamperCount] = useState("0");
  const [tentTariffCode, setTentTariffCode] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const isTentArea = place.type === "Zeltwiese";
  const isUnavailable =
    place.type === "Dauercamper" || place.type === "Gesperrt";

  const [showPlaceEdit, setShowPlaceEdit] = useState(false);
const [editPlaceName, setEditPlaceName] = useState(place.name);
const [editPlaceType, setEditPlaceType] = useState(place.type || "Stellplatz");
const [editPlaceCapacity, setEditPlaceCapacity] = useState(place.capacity);
const [editPlaceLength, setEditPlaceLength] = useState(
  place.length_m !== null && place.length_m !== undefined
    ? String(place.length_m)
    : ""
);
const [editPlacePricePerNight, setEditPlacePricePerNight] = useState(
  place.price_per_night !== null && place.price_per_night !== undefined
    ? String(place.price_per_night).replace(".", ",")
    : "15,00"
);
const [placeEditError, setPlaceEditError] = useState<string | null>(null);
const [placeEditSaving, setPlaceEditSaving] = useState(false);

  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);

    setVehicleSize(
      place.type === "Zeltwiese" ? "" : initialVehicleLengthM
    );

    setGuestName("");
    setTentCount("1");
    setNotes("");
    setGuestStreet("");
    setGuestPostalCode("");
    setGuestCity("");
    setAdultCount("1");
    setChildCount("0");
    setDayVisitorCount("0");
    setHasElectricity(false);
    setHasWaste(false);
    setHasRhineView(false);
    setDogCount("0");
    setCarCount("0");
    setMotorcycleCount("0");
    setCamperCount("0");
    setTentTariffCode("");
    setQuote(null);
    setQuoteError(null);
    setErrorMessage(null);

    setShowPlaceEdit(false);
    setEditPlaceName(place.name);
    setEditPlaceType(place.type || "Stellplatz");
    setEditPlaceCapacity(place.capacity);
    setEditPlaceLength(
      place.length_m !== null && place.length_m !== undefined
        ? String(place.length_m)
        : ""
    );
    setEditPlacePricePerNight(
      place.price_per_night !== null && place.price_per_night !== undefined
        ? String(place.price_per_night).replace(".", ",")
        : "15,00"
    );
    setPlaceEditError(null);
  }, [
    place.id,
    place.type,
    initialStartDate,
    initialEndDate,
    initialVehicleLengthM,
  ]);

  useEffect(() => {
    async function loadTariffs() {
      try {
        const items = await fetchTariffs(startDate || undefined);
        setTariffs(items);
      } catch {
        // Tarife sind fuer Kernfunktion nicht blockierend.
      }
    }

    loadTariffs();
  }, [startDate]);

  useEffect(() => {
    async function refreshQuote() {
      if (!startDate || !endDate || startDate >= endDate) {
        setQuote(null);
        setQuoteError(null);
        return;
      }

      try {
        setQuoteError(null);
        const nextQuote = await quoteBooking({
          place_id: place.id,
          place_name: place.name,
          place_type: place.type || undefined,
          start_date: startDate,
          end_date: endDate,
          guest_name: guestName.trim() || "Gast",
          guest_street: guestStreet.trim(),
          guest_postal_code: guestPostalCode.trim(),
          guest_city: guestCity.trim(),
          people_count: (Number(adultCount) || 0) + (Number(childCount) || 0),
          adult_count: Number(adultCount) || 0,
          child_count: Number(childCount) || 0,
          day_visitor_count: Number(dayVisitorCount) || 0,
          has_electricity: hasElectricity,
          has_waste: hasWaste,
          has_rhine_view: hasRhineView,
          dog_count: Number(dogCount) || 0,
          car_count: Number(carCount) || 0,
          motorcycle_count: Number(motorcycleCount) || 0,
          camper_count: Number(camperCount) || 0,
          camper_length_m: vehicleSize.trim() ? Number(vehicleSize.replace(",", ".")) : null,
          tent_tariff_code: tentTariffCode || null,
          vehicle_size: vehicleSize.trim(),
          tent_count: isTentArea ? Number(tentCount) || 0 : 0,
          notes: notes.trim(),
        });
        setQuote(nextQuote);
      } catch (err: any) {
        setQuote(null);
        setQuoteError(err.message || "Preisvorschau nicht verfuegbar");
      }
    }

    refreshQuote();
  }, [
    place.id,
    place.name,
    place.type,
    startDate,
    endDate,
    guestName,
    guestStreet,
    guestPostalCode,
    guestCity,
    adultCount,
    childCount,
    dayVisitorCount,
    hasElectricity,
    hasWaste,
    hasRhineView,
    dogCount,
    carCount,
    motorcycleCount,
    camperCount,
    tentTariffCode,
    vehicleSize,
    tentCount,
    notes,
    isTentArea,
  ]);

  const maxOccupancyInSelectedRange = useMemo(
    () =>
      getMaxOccupancyInRange(
        place,
        bookings,
        startDate,
        endDate
      ),
    [place, bookings, startDate, endDate]
  );

  const requestedUnits = isTentArea ? Number(tentCount) || 0 : 1;

  const hasConflict =
    startDate !== "" &&
    endDate !== "" &&
    maxOccupancyInSelectedRange + requestedUnits > place.capacity;

  function applyQuickRange(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
    setErrorMessage(null);
  }

  async function handleSavePlace() {
  if (!editPlaceName.trim()) {
    setPlaceEditError("Bitte einen Namen oder eine Platznummer eingeben.");
    return;
  }

  if (!Number.isInteger(editPlaceCapacity) || editPlaceCapacity < 1) {
    setPlaceEditError("Die Kapazität muss mindestens 1 betragen.");
    return;
  }

  const parsedLength =
    editPlaceLength.trim() === ""
      ? null
      : Number(editPlaceLength.replace(",", "."));

  const parsedPrice = Number(editPlacePricePerNight.replace(",", "."));

  if (
    parsedLength !== null &&
    (!Number.isFinite(parsedLength) || parsedLength <= 0)
  ) {
    setPlaceEditError("Bitte eine gültige Platzlänge eingeben.");
    return;
  }

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    setPlaceEditError("Bitte einen gültigen Preis pro Nacht eingeben.");
    return;
  }

  try {
    setPlaceEditSaving(true);
    setPlaceEditError(null);

    await updatePlace(place.id, {
      name: editPlaceName.trim(),
      type: editPlaceType,
      capacity: editPlaceCapacity,
      length_m: parsedLength,
      price_per_night: parsedPrice,
    });

    await onPlaceUpdated?.();
    setShowPlaceEdit(false);
  } catch (err: any) {
    setPlaceEditError(
      err.message || "Fehler beim Bearbeiten des Platzes"
    );
  } finally {
    setPlaceEditSaving(false);
  }
}

  async function handleSubmit() {
    if (!guestName.trim()) {
      setErrorMessage("Bitte einen Gastnamen eingeben.");
      return;
    }

    const parsedDogCount = Number(dogCount);
    if (!Number.isInteger(parsedDogCount) || parsedDogCount < 0) {
      setErrorMessage("Bitte eine gueltige Anzahl Hunde eingeben.");
      return;
    }

    const parsedAdultCount = Number(adultCount);
    const parsedChildCount = Number(childCount);
    const parsedDayVisitorCount = Number(dayVisitorCount);
    const parsedCarCount = Number(carCount);
    const parsedMotorcycleCount = Number(motorcycleCount);
    const parsedCamperCount = Number(camperCount);

    if (
      !Number.isInteger(parsedAdultCount) || parsedAdultCount < 0 ||
      !Number.isInteger(parsedChildCount) || parsedChildCount < 0 ||
      !Number.isInteger(parsedDayVisitorCount) || parsedDayVisitorCount < 0 ||
      !Number.isInteger(parsedCarCount) || parsedCarCount < 0 ||
      !Number.isInteger(parsedMotorcycleCount) || parsedMotorcycleCount < 0 ||
      !Number.isInteger(parsedCamperCount) || parsedCamperCount < 0
    ) {
      setErrorMessage("Bitte nur gueltige, nicht-negative Mengen eingeben.");
      return;
    }

    const parsedVehicleLength =
      vehicleSize.trim() === ""
        ? null
        : Number(vehicleSize.replace(",", "."));

    if (parsedCamperCount > 0) {
      if (parsedVehicleLength === null || !Number.isFinite(parsedVehicleLength) || parsedVehicleLength <= 0) {
        setErrorMessage("Bitte eine gueltige Fahrzeuglaenge fuer Wohnmobil/Wohnwagen eingeben.");
        return;
      }

      if (parsedVehicleLength > 8 && parsedVehicleLength <= 10) {
        setErrorMessage("Tarif fuer Fahrzeuglaengen zwischen 8 m und 10 m ist nicht definiert.");
        return;
      }
    }

    if (!startDate || !endDate) {
      setErrorMessage("Bitte Anreise und Abreise auswählen.");
      return;
    }

    if (startDate >= endDate) {
      setErrorMessage("Die Abreise muss nach der Anreise liegen.");
      return;
    }

    if (isUnavailable) {
      setErrorMessage("Dieser Platz kann nicht gebucht werden.");
      return;
    }

    if (isTentArea) {
      const parsedTentCount = Number(tentCount);

      if (
        !Number.isInteger(parsedTentCount) ||
        parsedTentCount < 1
      ) {
        setErrorMessage(
          "Bitte eine gültige Anzahl an Zelten eingeben."
        );
        return;
      }

      if (parsedTentCount > 0 && !tentTariffCode) {
        setErrorMessage("Bitte einen Zelt-Tarif auswaehlen.");
        return;
      }
    } else if (vehicleSize.trim() !== "") {
      const parsedVehicleLength = Number(
        vehicleSize.replace(",", ".")
      );

      if (
        !Number.isFinite(parsedVehicleLength) ||
        parsedVehicleLength <= 0
      ) {
        setErrorMessage(
          "Bitte eine gültige Fahrzeuglänge eingeben."
        );
        return;
      }

      if (
        place.length_m !== null &&
        place.length_m !== undefined &&
        parsedVehicleLength > place.length_m
      ) {
        setErrorMessage(
          `Das Fahrzeug ist zu lang. Maximal ${place.length_m} m erlaubt.`
        );
        return;
      }
    }

    if (hasConflict) {
      setErrorMessage(
        isTentArea
          ? `Nicht genügend freie Kapazität. Aktuell maximal ${maxOccupancyInSelectedRange} von ${place.capacity} Zelten belegt.`
          : "Der Platz ist in diesem Zeitraum bereits voll belegt."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      await createBooking({
        place_id: place.id,
        start_date: startDate,
        end_date: endDate,
        guest_name: guestName.trim(),
        guest_street: guestStreet.trim(),
        guest_postal_code: guestPostalCode.trim(),
        guest_city: guestCity.trim(),
        people_count: parsedAdultCount + parsedChildCount,
        adult_count: parsedAdultCount,
        child_count: parsedChildCount,
        day_visitor_count: parsedDayVisitorCount,
        has_electricity: hasElectricity,
        has_waste: hasWaste,
        has_rhine_view: hasRhineView,
        dog_count: parsedDogCount,
        car_count: parsedCarCount,
        motorcycle_count: parsedMotorcycleCount,
        camper_count: parsedCamperCount,
        camper_length_m: parsedVehicleLength,
        tent_tariff_code: tentTariffCode || null,

        vehicle_size: vehicleSize.trim()
          ? isTentArea
            ? vehicleSize.trim()
            : `${vehicleSize.trim()} m`
          : "",

        tent_count: isTentArea
          ? Number(tentCount)
          : null,

        notes: notes.trim(),
      });

      await onBookingCreated();

      setGuestName("");
      setGuestStreet("");
      setGuestPostalCode("");
      setGuestCity("");
      setVehicleSize("");
      setTentCount("1");
      setAdultCount("1");
      setChildCount("0");
      setDayVisitorCount("0");
      setHasElectricity(false);
      setHasWaste(false);
      setHasRhineView(false);
      setDogCount("0");
      setCarCount("0");
      setMotorcycleCount("0");
      setCamperCount("0");
      setTentTariffCode("");
      setNotes("");

      onBookingFinished?.();
    } catch (err: any) {
      setErrorMessage(
        err.message || "Fehler beim Anlegen der Buchung"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={placeInfoStyle}>
        <div>
          <div style={placeLabelStyle}>Ausgewählter Platz</div>
          <div style={placeTitleStyle}>Platz {place.name}</div>
        </div>

        <div style={badgeRowStyle}>
          <span style={badgeStyle}>
            {place.type || "Stellplatz"}
          </span>

          <span style={badgeStyle}>
            Kapazität {place.capacity}
          </span>

          {!isTentArea && (
            <span style={badgeStyle}>
              📏{" "}
              {place.length_m !== null &&
              place.length_m !== undefined
                ? `${place.length_m} m`
                : "Länge nicht gesetzt"}
            </span>
          )}
        </div>
      </div>

      {canEditPlace && (
          <div style={placeEditWrapperStyle}>
            <button
              type="button"
              onClick={() => setShowPlaceEdit((prev) => !prev)}
              style={placeEditToggleStyle}
            >
              🛠️ {showPlaceEdit ? "Platzbearbeitung schließen" : "Platz bearbeiten"}
            </button>

            {showPlaceEdit && (
              <div style={placeEditPanelStyle}>
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Name / Nummer</label>
                    <input
                      value={editPlaceName}
                      onChange={(e) => setEditPlaceName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Typ</label>
                    <select
                      value={editPlaceType}
                      onChange={(e) => setEditPlaceType(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="Stellplatz">Stellplatz</option>
                      <option value="Zeltwiese">Zeltwiese</option>
                      <option value="Dauercamper">Dauercamper</option>
                      <option value="Gesperrt">Gesperrt</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Kapazität</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editPlaceCapacity}
                      onChange={(e) =>
                        setEditPlaceCapacity(Number(e.target.value))
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Platzlänge in m</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editPlaceLength}
                      onChange={(e) => setEditPlaceLength(e.target.value)}
                      placeholder="z. B. 8,5"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Preis pro Nacht (EUR)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editPlacePricePerNight}
                      onChange={(e) => setEditPlacePricePerNight(e.target.value)}
                      placeholder="z. B. 15,00"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {placeEditError && (
                  <div style={errorBoxStyle}>{placeEditError}</div>
                )}

                <div style={buttonRowStyle}>
                  <button
                    type="button"
                    onClick={handleSavePlace}
                    disabled={placeEditSaving}
                    style={{
                      ...primaryButtonStyle,
                      opacity: placeEditSaving ? 0.6 : 1,
                    }}
                  >
                    {placeEditSaving
                      ? "Wird gespeichert …"
                      : "Platzänderungen speichern"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      <div style={quickActionWrapperStyle}>
        <div style={quickActionLabelStyle}>Schnellauswahl</div>

        <div style={quickActionRowStyle}>
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              applyQuickRange(
                toIsoDate(today),
                toIsoDate(addDays(today, 1))
              );
            }}
            style={quickActionButtonStyle}
          >
            Heute → morgen
          </button>

          <button
            type="button"
            onClick={() => {
              const today = new Date();
              applyQuickRange(
                toIsoDate(today),
                toIsoDate(addDays(today, 7))
              );
            }}
            style={quickActionButtonStyle}
          >
            Heute → 7 Tage
          </button>

          <button
            type="button"
            onClick={() => {
              const range = getNextWeekendRange();
              applyQuickRange(range.start, range.end);
            }}
            style={quickActionButtonStyle}
          >
            Wochenende
          </button>

          <button
            type="button"
            onClick={() => {
              const range = getNextWeekRange();
              applyQuickRange(range.start, range.end);
            }}
            style={quickActionButtonStyle}
          >
            Nächste Woche
          </button>
        </div>
      </div>

      <div style={formGridStyle}>
        <div>
          <label style={labelStyle}>Name des Gastes</label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Anreise</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Abreise</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Strasse und Hausnummer</label>
          <input
            value={guestStreet}
            onChange={(e) => setGuestStreet(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>PLZ</label>
          <input
            value={guestPostalCode}
            onChange={(e) => setGuestPostalCode(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Ort</label>
          <input
            value={guestCity}
            onChange={(e) => setGuestCity(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>🚐 Fahrzeuglänge in m</label>

          <input
            type="text"
            inputMode="decimal"
            value={vehicleSize}
            onChange={(e) => setVehicleSize(e.target.value)}
            placeholder="z. B. 7,5"
            style={inputStyle}
          />
        </div>

        {isTentArea && (
          <div>
            <label style={labelStyle}>🏕️ Anzahl Zelte</label>
            <input
              type="number"
              min="1"
              step="1"
              value={tentCount}
              onChange={(e) => setTentCount(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {isTentArea && (
          <div>
            <label style={labelStyle}>Zelt-Tarif</label>
            <select
              value={tentTariffCode}
              onChange={(e) => setTentTariffCode(e.target.value)}
              style={inputStyle}
            >
              <option value="">Bitte waehlen</option>
              {tariffs
                .filter((tariff) => tariff.code.startsWith("tent_"))
                .map((tariff) => (
                  <option key={tariff.code} value={tariff.code}>
                    {tariff.label} ({formatEuro(tariff.price)})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Erwachsene</label>
          <input
            type="number"
            min="0"
            value={adultCount}
            onChange={(e) => setAdultCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Kinder bis 14 Jahre</label>
          <input
            type="number"
            min="0"
            value={childCount}
            onChange={(e) => setChildCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Tagesbesucher</label>
          <input
            type="number"
            min="0"
            value={dayVisitorCount}
            onChange={(e) => setDayVisitorCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Auto</label>
          <input
            type="number"
            min="0"
            value={carCount}
            onChange={(e) => setCarCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Motorrad</label>
          <input
            type="number"
            min="0"
            value={motorcycleCount}
            onChange={(e) => setMotorcycleCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Wohnmobil/Wohnwagen</label>
          <input
            type="number"
            min="0"
            value={camperCount}
            onChange={(e) => setCamperCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Anzahl Hunde</label>
          <input
            type="number"
            min="0"
            value={dogCount}
            onChange={(e) => setDogCount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Strom</label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={hasElectricity}
              onChange={(e) => setHasElectricity(e.target.checked)}
            />
            Strompauschale pro Nacht berechnen
          </label>
        </div>

        <div>
          <label style={labelStyle}>Muell</label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={hasWaste}
              onChange={(e) => setHasWaste(e.target.checked)}
            />
            Muellpauschale pro Tag
          </label>
        </div>

        <div>
          <label style={labelStyle}>Erste Reihe mit Rheinblick</label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={hasRhineView}
              onChange={(e) => setHasRhineView(e.target.checked)}
            />
            Einmalige Zusatzleistung
          </label>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Weitere Informationen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </div>
      </div>

      {startDate && endDate && !isUnavailable && (
        <div
          style={{
            ...infoBoxStyle,
            backgroundColor: hasConflict
              ? "#fee2e2"
              : "#dcfce7",
            color: hasConflict ? "#991b1b" : "#166534",
            borderColor: hasConflict
              ? "#fecaca"
              : "#bbf7d0",
          }}
        >
          {hasConflict
            ? isTentArea
              ? `⚠️ Nicht genügend Platz: ${maxOccupancyInSelectedRange} bereits belegt, ${requestedUnits} zusätzlich angefragt, Kapazität ${place.capacity}.`
              : "⚠️ Der Platz ist in diesem Zeitraum voll belegt."
            : isTentArea
              ? `✅ Verfügbar: ${maxOccupancyInSelectedRange} von ${place.capacity} Zelten bisher belegt.`
              : `✅ Zeitraum verfügbar (${maxOccupancyInSelectedRange}/${place.capacity} belegt).`}
        </div>
      )}

      {isUnavailable && (
        <div style={blockedBoxStyle}>
          Dieser Platz ist als {place.type} markiert und kann nicht
          gebucht werden.
        </div>
      )}

      {(quote || quoteError) && (
        <div style={pricePreviewBoxStyle}>
          <div style={pricePreviewTitleStyle}>Preisuebersicht</div>
          {quoteError && <div style={errorTextStyle}>{quoteError}</div>}

          {quote && (
            <>
              <div style={pricePreviewTotalStyle}>Gesamt: {formatEuro(quote.total)}</div>
              <div style={pricePreviewMetaStyle}>
                {quote.nights} {quote.nights === 1 ? "Nacht" : "Naechte"} / {quote.days} {quote.days === 1 ? "Tag" : "Tage"}
              </div>

              <div style={priceItemListStyle}>
                {quote.items.map((item) => (
                  <div key={`${item.description}-${item.quantity}`} style={priceItemRowStyle}>
                    <span>{item.description}</span>
                    <span>
                      {item.quantity} x {formatEuro(item.unit_price)} = {formatEuro(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div style={errorBoxStyle}>{errorMessage}</div>
      )}

      <div style={buttonRowStyle}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            saving ||
            isUnavailable ||
            !guestName.trim() ||
            !startDate ||
            !endDate ||
            hasConflict
          }
          style={{
            ...primaryButtonStyle,
            opacity:
              saving ||
              isUnavailable ||
              !guestName.trim() ||
              !startDate ||
              !endDate ||
              hasConflict
                ? 0.6
                : 1,
            cursor:
              saving ||
              isUnavailable ||
              !guestName.trim() ||
              !startDate ||
              !endDate ||
              hasConflict
                ? "not-allowed"
                : "pointer",
          }}
        >
          {saving ? "Buchung wird angelegt …" : "Buchung anlegen"}
        </button>
      </div>
    </div>
  );
}

const placeInfoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  flexWrap: "wrap",
  padding: "0.9rem 1rem",
  marginBottom: "1rem",
  borderRadius: "0.9rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#f8fafc",
};

const placeLabelStyle: React.CSSProperties = {
  color: "#5f766b",
  fontSize: "0.8rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const placeTitleStyle: React.CSSProperties = {
  marginTop: "0.25rem",
  color: "#163126",
  fontSize: "1.25rem",
  fontWeight: 800,
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.45rem",
  flexWrap: "wrap",
};

const badgeStyle: React.CSSProperties = {
  padding: "0.38rem 0.65rem",
  borderRadius: "999px",
  border: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
  color: "#355447",
  fontSize: "0.84rem",
  fontWeight: 700,
};

const quickActionWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const quickActionLabelStyle: React.CSSProperties = {
  marginBottom: "0.45rem",
  color: "#5f766b",
  fontSize: "0.86rem",
  fontWeight: 700,
};

const quickActionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.55rem",
  flexWrap: "wrap",
};

const quickActionButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "999px",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#355447",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 700,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.85rem",
  alignItems: "end",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.35rem",
  color: "#5f766b",
  fontSize: "0.9rem",
  fontWeight: 700,
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.45rem",
  color: "#355447",
  fontSize: "0.9rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.82rem",
  border: "1px solid #bfd4c7",
  borderRadius: "0.75rem",
  backgroundColor: "#ffffff",
  color: "#163126",
  boxSizing: "border-box",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  fontFamily: "inherit",
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.8rem 0.95rem",
  borderRadius: "0.8rem",
  border: "1px solid transparent",
  fontSize: "0.94rem",
  lineHeight: 1.45,
};

const blockedBoxStyle: React.CSSProperties = {
  ...infoBoxStyle,
  backgroundColor: "#f3f4f6",
  borderColor: "#e5e7eb",
  color: "#374151",
};

const errorBoxStyle: React.CSSProperties = {
  ...infoBoxStyle,
  backgroundColor: "#fee2e2",
  borderColor: "#fecaca",
  color: "#991b1b",
};

const errorTextStyle: React.CSSProperties = {
  color: "#991b1b",
  fontSize: "0.9rem",
};

const pricePreviewBoxStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.9rem",
  borderRadius: "0.8rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#f8fafc",
};

const pricePreviewTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  color: "#163126",
  marginBottom: "0.45rem",
};

const pricePreviewTotalStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 800,
  color: "#166534",
};

const pricePreviewMetaStyle: React.CSSProperties = {
  color: "#5f766b",
  fontSize: "0.88rem",
  marginBottom: "0.45rem",
};

const priceItemListStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.25rem",
};

const priceItemRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "0.75rem",
  fontSize: "0.88rem",
  color: "#355447",
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "1rem",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.78rem 1.05rem",
  borderRadius: "0.75rem",
  border: "1px solid #15803d",
  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  color: "#ffffff",
  fontWeight: 700,
  boxShadow: "0 8px 18px rgba(21, 128, 61, 0.2)",
};

const placeEditWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const placeEditToggleStyle: React.CSSProperties = {
  padding: "0.6rem 0.85rem",
  borderRadius: "0.75rem",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#166534",
  cursor: "pointer",
  fontWeight: 700,
};

const placeEditPanelStyle: React.CSSProperties = {
  marginTop: "0.75rem",
  padding: "1rem",
  borderRadius: "0.9rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#f8fafc",
};