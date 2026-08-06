import { useEffect, useMemo, useState } from "react";
import type { Booking, Place } from "../types";
import { createBooking, updatePlace } from "../services/api";

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setPlaceEditError(null);
  }, [
    place.id,
    place.type,
    initialStartDate,
    initialEndDate,
    initialVehicleLengthM,
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

  if (
    parsedLength !== null &&
    (!Number.isFinite(parsedLength) || parsedLength <= 0)
  ) {
    setPlaceEditError("Bitte eine gültige Platzlänge eingeben.");
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
      setVehicleSize("");
      setTentCount("1");
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
          <label style={labelStyle}>
            {isTentArea
              ? "⛺ Zeltgröße"
              : "🚐 Fahrzeuglänge in m"}
          </label>

          <input
            type="text"
            inputMode={isTentArea ? "text" : "decimal"}
            value={vehicleSize}
            onChange={(e) => setVehicleSize(e.target.value)}
            placeholder={
              isTentArea
                ? "z. B. Familienzelt / 4 × 3 m"
                : "z. B. 7,5"
            }
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