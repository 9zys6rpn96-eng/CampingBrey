import { useEffect, useMemo, useState } from "react";
import type { Place, Booking } from "../types";
import { BookingList } from "./BookingList";
import { BookingTimeline } from "./BookingTimeline";
import { createBooking, deleteBooking, updatePlace } from "../services/api";

interface Props {
  place: Place | null;
  bookings: Booking[];
  onBookingCreated: () => void | Promise<void>;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getMaxOccupancyInRange(
  bookings: Booking[],
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate || startDate >= endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  let maxOccupancy = 0;

  for (
    let current = new Date(start);
    current < end;
    current.setDate(current.getDate() + 1)
  ) {
    const currentIso = current.toISOString().split("T")[0];

    const occupancy = bookings.filter(
      (booking) =>
        booking.start_date <= currentIso && currentIso < booking.end_date
    ).length;

    if (occupancy > maxOccupancy) {
      maxOccupancy = occupancy;
    }
  }

  return maxOccupancy;
}

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextWeekendRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = So, 1 = Mo, ..., 6 = Sa

  const daysUntilFriday = day <= 5 ? 5 - day : 6;
  const friday = addDays(today, daysUntilFriday);
  const sunday = addDays(friday, 2);

  friday.setHours(0, 0, 0, 0);
  sunday.setHours(0, 0, 0, 0);

  return {
    start: toIsoDate(friday),
    end: toIsoDate(sunday),
  };
}

function getNextWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = So
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

  const monday = addDays(today, daysUntilNextMonday);
  const nextMonday = addDays(monday, 7);

  monday.setHours(0, 0, 0, 0);
  nextMonday.setHours(0, 0, 0, 0);

  return {
    start: toIsoDate(monday),
    end: toIsoDate(nextMonday),
  };
}

const PLACE_TYPE_OPTIONS = ["Stellplatz", "Dauercamper", "Zeltwiese"] as const;
const CUSTOM_PLACE_TYPE = "__custom__";

export function PlaceDetailPanel({ place, bookings, onBookingCreated }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [selectedTypeOption, setSelectedTypeOption] = useState<string>("Stellplatz");
  const [editCapacity, setEditCapacity] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [vehicleSize, setVehicleSize] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (place) {
      const currentType = place.type || "Stellplatz";

      setEditName(place.name);
      setEditType(currentType);
      setEditCapacity(place.capacity || 1);

      if (PLACE_TYPE_OPTIONS.includes(currentType as (typeof PLACE_TYPE_OPTIONS)[number])) {
        setSelectedTypeOption(currentType);
      } else {
        setSelectedTypeOption(CUSTOM_PLACE_TYPE);
      }

      setErrorMessage(null);
      setStartDate("");
      setEndDate("");
      setGuestName("");
      setVehicleSize("");
      setNotes("");
    }
  }, [place]);

  const today = new Date().toISOString().split("T")[0];

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [bookings]
  );

  if (!place) {
    return (
      <div style={emptyStateStyle}>
        <div style={emptyIconStyle}>🏕️</div>
        <h3 style={emptyTitleStyle}>Kein Platz ausgewählt</h3>
        <p style={emptyTextStyle}>
          Wähle links in der Liste oder direkt auf der Karte einen Platz aus, um Details,
          Buchungen und Bearbeitungsmöglichkeiten zu sehen.
        </p>
      </div>
    );
  }
  const currentPlace = place;
  const isCurrentlyBooked = bookings.some(
    (booking) => today >= booking.start_date && today < booking.end_date
  );

  const upcomingBookings = sortedBookings
    .filter((b) => b.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const nextBooking = upcomingBookings[0] ?? null;

  const currentOccupancy = bookings.filter(
    (booking) => today >= booking.start_date && today < booking.end_date
  ).length;

  const maxOccupancyInSelectedRange =
    startDate && endDate
      ? getMaxOccupancyInRange(bookings, startDate, endDate)
      : 0;

  const hasConflict = maxOccupancyInSelectedRange >= currentPlace.capacity;
  const isPermanentCamper = currentPlace.type === "Dauercamper";

  function applyQuickRange(start: string, end: string) {
      setStartDate(start);
      setEndDate(end);
      setErrorMessage(null);
    }

  async function handleSubmit() {
    if (!startDate || !endDate) {
      setErrorMessage("Bitte Start- und Enddatum auswählen.");
      return;
    }

    if (!guestName.trim()) {
      setErrorMessage("Bitte einen Namen eingeben.");
      return;
    }

    try {
      setErrorMessage(null);

      await createBooking({
        place_id: currentPlace.id,
        start_date: startDate,
        end_date: endDate,
        guest_name: guestName,
        vehicle_size: vehicleSize,
        notes: notes,
      });

      await onBookingCreated();
      setStartDate("");
      setEndDate("");
      setGuestName("");
      setVehicleSize("");
      setNotes("");
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  }

  async function handleSavePlace() {
    try {
      setErrorMessage(null);

      await updatePlace(currentPlace.id, {
        name: editName,
        type: editType,
        capacity: editCapacity,
      });

      await onBookingCreated();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  }

  function requestDeleteBooking(bookingId: number) {
    setBookingToDelete(bookingId);
  }

  async function confirmDeleteBooking() {
    if (bookingToDelete === null) return;

    try {
      setErrorMessage(null);
      await deleteBooking(bookingToDelete);
      setBookingToDelete(null);
      await onBookingCreated();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  }

  function cancelDeleteBooking() {
    setBookingToDelete(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <section style={heroSectionStyle}>
        <div style={heroLeftStyle}>
          <div style={eyebrowStyle}>Ausgewählter Platz</div>
          <h2 style={heroTitleStyle}>Platz {currentPlace.name}</h2>
          <div style={metaRowStyle}>
            <span style={metaBadgeStyle}>{currentPlace.type || "Stellplatz"}</span>
            <span style={metaBadgeStyle}>Kapazität {currentPlace.capacity}</span>
          </div>
        </div>

        <div
          style={{
            ...statusPillStyle,
            backgroundColor: isCurrentlyBooked ? "#fee2e2" : "#dcfce7",
            color: isCurrentlyBooked ? "#991b1b" : "#166534",
            borderColor: isCurrentlyBooked ? "#fecaca" : "#bbf7d0",
          }}
        >
          {isCurrentlyBooked ? "🔴 Aktuell belegt" : "🟢 Aktuell frei"}
        </div>
      </section>

      <section style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Aktuelle Belegung</div>
          <div style={statValueStyle}>
            {currentOccupancy} / {currentPlace.capacity}
          </div>
          <div style={statHelpStyle}>gleichzeitig belegte Einheiten heute</div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Gebucht ab</div>
          <div style={statValueStyleSmall}>
            {nextBooking ? formatDate(nextBooking.start_date) : "—"}
          </div>
          <div style={statHelpStyle}>
            {nextBooking ? "nächster Belegungsbeginn" : "keine zukünftige Buchung"}
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Frei ab</div>
          <div style={statValueStyleSmall}>
            {nextBooking ? formatDate(nextBooking.end_date) : "—"}
          </div>
          <div style={statHelpStyle}>
            {nextBooking ? "wieder verfügbar ab" : "aktuell nichts geplant"}
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Platz bearbeiten</h3>
            <p style={sectionSubtitleStyle}>
              Name, Typ und Kapazität des Platzes anpassen.
            </p>
          </div>
        </div>

        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>Name / Nummer</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Typ</label>
            <select
              value={selectedTypeOption}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTypeOption(value);

                if (value !== CUSTOM_PLACE_TYPE) {
                  setEditType(value);
                } else {
                  setEditType("");
                }
              }}
              style={inputStyle}
            >
              {PLACE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_PLACE_TYPE}>Anderer Typ...</option>
            </select>

            {selectedTypeOption === CUSTOM_PLACE_TYPE && (
              <input
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                placeholder="Eigenen Typ eingeben"
                style={{ ...inputStyle, marginTop: "0.6rem" }}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>Kapazität</label>
            <input
              type="number"
              min="1"
              value={editCapacity}
              onChange={(e) => setEditCapacity(Number(e.target.value))}
              style={inputStyle}
            />
          </div>

          <div style={buttonFieldStyle}>
            <button onClick={handleSavePlace} style={primaryButtonStyle}>
              Änderungen speichern
            </button>
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Belegungsübersicht</h3>
            <p style={sectionSubtitleStyle}>
              Zeitliche Übersicht der vorhandenen Buchungen für diesen Platz.
            </p>
          </div>
        </div>

        <div style={innerSurfaceStyle}>
          <BookingTimeline bookings={sortedBookings} />
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Buchungen</h3>
            <p style={sectionSubtitleStyle}>
              Alle vorhandenen Buchungen für Platz {currentPlace.name}.
            </p>
          </div>
        </div>

        <BookingList bookings={sortedBookings} onDelete={requestDeleteBooking} />
      </section>

        <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
                <div>
                    <h3 style={sectionTitleStyle}>Neue Buchung</h3>
                    <p style={sectionSubtitleStyle}>
                        Gastdaten und Zeitraum für eine neue Belegung erfassen.
                    </p>
                </div>
            </div>
            <div style={quickActionWrapperStyle}>
                <div style={quickActionLabelStyle}>Schnellauswahl</div>

                <div style={quickActionRowStyle}>
                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            const tomorrow = addDays(today, 1);
                            applyQuickRange(toIsoDate(today), toIsoDate(tomorrow));
                        }}
                        style={quickActionButtonStyle}
                    >
                        Heute → morgen
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const today = new Date();
                            const nextWeek = addDays(today, 7);
                            applyQuickRange(toIsoDate(today), toIsoDate(nextWeek));
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

            <div style={formGridWideStyle}>
                <div>
                    <label style={labelStyle}>Name</label>
                    <input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Fahrzeuggröße</label>
                    <input
                        value={vehicleSize}
                        onChange={(e) => setVehicleSize(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={{gridColumn: "1 / -1"}}>
                    <label style={labelStyle}>Weitere Informationen</label>
                    <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Von</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Bis</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={buttonFieldStyle}>
                    <button
                        onClick={handleSubmit}
                        disabled={
                            !startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper
                        }
                        style={{
                            ...primaryButtonStyle,
                            opacity:
                                !startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper
                                    ? 0.6
                                    : 1,
                            cursor:
                                !startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        Buchung anlegen
                    </button>
                </div>
            </div>

            {startDate && endDate && (
              <div
                style={{
                  ...infoBoxStyle,
                  backgroundColor: hasConflict ? "#fee2e2" : "#dcfce7",
                  color: hasConflict ? "#991b1b" : "#166534",
                  borderColor: hasConflict ? "#fecaca" : "#bbf7d0",
                }}
              >
                {hasConflict
                  ? `⚠️ Zeitraum an mindestens einem Tag voll belegt (${maxOccupancyInSelectedRange}/${currentPlace.capacity})`
                  : `✅ Zeitraum verfügbar (max. ${maxOccupancyInSelectedRange}/${currentPlace.capacity} gleichzeitig belegt)`}
              </div>
            )}

            {isPermanentCamper && (
                <div
                    style={{
                        ...infoBoxStyle,
                        backgroundColor: "#f3f4f6",
                        color: "#374151",
                        borderColor: "#e5e7eb",
                    }}
                >
                    Dieser Platz ist als Dauercamper markiert und kann nicht gebucht werden.
                </div>
            )}

            {errorMessage && (
                <div
                    style={{
                        ...infoBoxStyle,
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderColor: "#fecaca",
                    }}
                >
                    {errorMessage}
                </div>
            )}
        </section>

        {bookingToDelete !== null && (
            <div style={modalOverlayStyle}>
                <div style={modalCardStyle}>
                    <h3 style={{marginTop: 0, marginBottom: "0.75rem", color: "#163126"}}>
                        Buchung stornieren
                    </h3>

                    <p style={{marginBottom: "1rem", color: "#4b5563", lineHeight: 1.5}}>
                        Möchtest du diese Buchung wirklich stornieren?
                    </p>

                    <div style={modalButtonRowStyle}>
                        <button onClick={cancelDeleteBooking} style={secondaryButtonStyle}>
                            Abbrechen
                        </button>

                        <button
                            onClick={confirmDeleteBooking}
                            style={{
                                ...dangerButtonStyle,
                                backgroundColor: "#dc2626",
                                borderColor: "#dc2626",
                            }}
                        >
                            Stornieren
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

const emptyStateStyle: React.CSSProperties = {
    padding: "2rem 1.25rem",
    borderRadius: "1rem",
    border: "1px dashed #cbd5e1",
    backgroundColor: "#f8fafc",
    textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "0.75rem",
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.1rem",
  color: "#163126",
};

const emptyTextStyle: React.CSSProperties = {
  margin: "0.5rem auto 0 auto",
  maxWidth: "520px",
  color: "#5f766b",
  lineHeight: 1.5,
};

const heroSectionStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  flexWrap: "wrap",
  padding: "1rem 1.1rem",
  borderRadius: "1rem",
  border: "1px solid #d7e4db",
  background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
};

const heroLeftStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#166534",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.5rem",
  lineHeight: 1.15,
  color: "#163126",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const metaBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.38rem 0.7rem",
  borderRadius: "999px",
  backgroundColor: "#ffffff",
  border: "1px solid #d7e4db",
  color: "#355447",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const statusPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.75rem 0.95rem",
  borderRadius: "0.9rem",
  border: "1px solid transparent",
  fontWeight: 700,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.85rem",
};

const statCardStyle: React.CSSProperties = {
  padding: "0.95rem 1rem",
  borderRadius: "1rem",
  backgroundColor: "#ffffff",
  border: "1px solid #d7e4db",
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: "0.86rem",
  color: "#5f766b",
  marginBottom: "0.4rem",
  fontWeight: 600,
};

const statValueStyle: React.CSSProperties = {
  fontSize: "1.45rem",
  fontWeight: 800,
  color: "#163126",
};

const statValueStyleSmall: React.CSSProperties = {
  fontSize: "1.08rem",
  fontWeight: 800,
  color: "#163126",
};

const statHelpStyle: React.CSSProperties = {
  marginTop: "0.35rem",
  fontSize: "0.86rem",
  color: "#6b7280",
  lineHeight: 1.4,
};

const panelStyle: React.CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: "0.9rem",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.05rem",
  fontWeight: 800,
  color: "#163126",
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "0.3rem 0 0 0",
  color: "#5f766b",
  fontSize: "0.94rem",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.85rem",
  alignItems: "end",
};

const formGridWideStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.85rem",
  alignItems: "end",
};

const buttonFieldStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "end",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.9rem",
  marginBottom: "0.35rem",
  color: "#5f766b",
  fontWeight: 600,
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

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.78rem 1.05rem",
  borderRadius: "0.75rem",
  border: "1px solid #15803d",
  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 8px 18px rgba(21, 128, 61, 0.20)",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#163126",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerButtonStyle: React.CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.75rem",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const innerSurfaceStyle: React.CSSProperties = {
  padding: "0.85rem",
  borderRadius: "0.85rem",
  backgroundColor: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  padding: "0.8rem 0.95rem",
  borderRadius: "0.8rem",
  border: "1px solid transparent",
  fontSize: "0.95rem",
  lineHeight: 1.45,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "1rem",
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "1rem",
  padding: "1.25rem",
  width: "100%",
  maxWidth: "420px",
  boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
  border: "1px solid #e5e7eb",
};

const modalButtonRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const quickActionWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const quickActionLabelStyle: React.CSSProperties = {
  fontSize: "0.86rem",
  fontWeight: 700,
  color: "#5f766b",
  marginBottom: "0.45rem",
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