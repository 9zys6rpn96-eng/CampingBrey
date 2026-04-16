import { useEffect, useState } from "react";
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
  }
}, [place]);

  if (!place) {
    return <p>Bitte einen Platz auswählen.</p>;
  }

  const today = new Date().toISOString().split("T")[0];

  const isCurrentlyBooked = bookings.some(
    (booking) => today >= booking.start_date && today <= booking.end_date
  );

  const upcomingBookings = bookings
    .filter((b) => b.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const nextBooking = upcomingBookings[0] ?? null;
  const currentOccupancy = bookings.filter(
  (booking) => today >= booking.start_date && today < booking.end_date
  ).length;

  const overlappingBookingsCount =
  startDate && endDate
    ? bookings.filter(
        (b) => startDate < b.end_date && endDate > b.start_date
      ).length
    : 0;

  const hasConflict = overlappingBookingsCount >= place.capacity;
  const isPermanentCamper = place.type === "Dauercamper";

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
          place_id: place.id,
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

      await updatePlace(place.id, {
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
      <div>
          <h2 style={{marginTop: 0, marginBottom: "0.5rem", color: "#111827"}}>
              Platz: {place.name}{" "}
              {place.type && <span style={{opacity: 0.7}}>({place.type})</span>}
          </h2>

          <div
              style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: isCurrentlyBooked ? "#fee2e2" : "#dcfce7",
                  color: isCurrentlyBooked ? "#991b1b" : "#166534",
                  border: `1px solid ${isCurrentlyBooked ? "#fecaca" : "#bbf7d0"}`,
                  fontWeight: 600,
              }}
          >
              {isCurrentlyBooked ? "🔴 Aktuell belegt" : "🟢 Aktuell frei"}
          </div>

          <div
              style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#1e293b",
              }}
          >
              {nextBooking ? (
                  <div
                      style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                      }}
                  >
                      <div>
                          Gebucht ab <strong>{formatDate(nextBooking.start_date)}</strong>
                      </div>
                      <div>
                          Gebucht bis <strong>{formatDate(nextBooking.end_date)}</strong>
                      </div>
                  </div>
              ) : (
                  <>Keine zukünftigen Buchungen</>
              )}
          </div>

          <div
              style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
              }}
          >
              Belegung aktuell: <strong>{currentOccupancy} / {place.capacity}</strong>
          </div>

          <div
              style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  backgroundColor: "#f9fafb",
              }}
          >
              <h3 style={{marginTop: 0, marginBottom: "0.75rem", color: "#111827"}}>
                  Platz bearbeiten
              </h3>

              <div
                  style={{
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      alignItems: "end",
                  }}
              >
                  <div>
                      <label
                          style={{
                              display: "block",
                              fontSize: "0.9rem",
                              marginBottom: "0.25rem",
                          }}
                      >
                          Name / Nummer
                      </label>
                      <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{
                              padding: "0.5rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "0.5rem",
                          }}
                      />
                  </div>

                  <div>
                      <label
                          style={{
                              display: "block",
                              fontSize: "0.9rem",
                              marginBottom: "0.25rem",
                          }}
                      >
                          Typ
                      </label>

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
                          style={{
                              padding: "0.5rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "0.5rem",
                              backgroundColor: "white",
                              minWidth: "180px",
                          }}
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
                              style={{
                                  marginTop: "0.5rem",
                                  padding: "0.5rem",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "0.5rem",
                                  display: "block",
                                  minWidth: "180px",
                              }}
                          />
                      )}
                  </div>

                  <div>
                      <label
                          style={{
                              display: "block",
                              fontSize: "0.9rem",
                              marginBottom: "0.25rem",
                          }}
                      >
                          Kapazität
                      </label>
                      <input
                          type="number"
                          min="1"
                          value={editCapacity}
                          onChange={(e) => setEditCapacity(Number(e.target.value))}
                          style={{
                              width: "110px",
                              padding: "0.5rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "0.5rem",
                          }}
                      />
                  </div>

                  <div>
                      <button
                          onClick={handleSavePlace}
                          style={{
                              padding: "0.6rem 1rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #2563eb",
                              backgroundColor: "#2563eb",
                              color: "white",
                              cursor: "pointer",
                          }}
                      >
                          Speichern
                      </button>
                  </div>
              </div>
          </div>

          <h3 style={{marginBottom: "0.5rem", color: "#111827"}}>
              Belegungsübersicht
          </h3>
          <BookingTimeline bookings={bookings}/>

          <h3
              style={{
                  marginTop: "1.25rem",
                  marginBottom: "0.5rem",
                  color: "#111827",
              }}
          >
              Buchungen
          </h3>
          <BookingList bookings={bookings} onDelete={requestDeleteBooking}/>

          <div
              style={{
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e5e7eb",
              }}
          >
              <h3 style={{marginBottom: "0.75rem", color: "#111827"}}>
                  Neue Buchung
              </h3>
              <div>
                  <label
                      style={{
                          display: "block",
                          fontSize: "0.9rem",
                          marginBottom: "0.25rem",
                      }}
                  >
                      Name
                  </label>
                  <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          minWidth: "180px",
                      }}
                  />
              </div>

              <div>
                  <label
                      style={{
                          display: "block",
                          fontSize: "0.9rem",
                          marginBottom: "0.25rem",
                      }}
                  >
                      Fahrzeuggröße
                  </label>
                  <input
                      value={vehicleSize}
                      onChange={(e) => setVehicleSize(e.target.value)}
                      style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          minWidth: "160px",
                      }}
                  />
              </div>

              <div style={{minWidth: "240px"}}>
                  <label
                      style={{
                          display: "block",
                          fontSize: "0.9rem",
                          marginBottom: "0.25rem",
                      }}
                  >
                      Weitere Informationen
                  </label>
                  <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          width: "100%",
                      }}
                  />
              </div>
              <div
                  style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                  }}
              >
                  <div>
                      <label
                          style={{
                              display: "block",
                              fontSize: "0.9rem",
                              marginBottom: "0.25rem",
                          }}
                      >
                          Von
                      </label>
                      <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{
                              padding: "0.5rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "0.5rem",
                          }}
                      />
                  </div>

                  <div>
                      <label
                          style={{
                              display: "block",
                              fontSize: "0.9rem",
                              marginBottom: "0.25rem",
                          }}
                      >
                          Bis
                      </label>
                      <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{
                              padding: "0.5rem",
                              border: "1px solid #d1d5db",
                              borderRadius: "0.5rem",
                          }}
                      />
                  </div>

                  <div style={{alignSelf: "end"}}>
                      <button
                          onClick={handleSubmit}
                          disabled={!startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper}
                          style={{
                              padding: "0.6rem 1rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #2563eb",
                              backgroundColor:
                                  !startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper
                                      ? "#9ca3af"
                                      : "#2563eb",
                              color: "white",
                              cursor:
                                  !startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper
                                      ? "not-allowed"
                                      : "pointer",
                              opacity:
                                  !startDate || !endDate || !guestName.trim() || hasConflict || isPermanentCamper
                                      ? 0.7
                                      : 1,
                          }}
                      >
                          Buchen
                      </button>
                  </div>
              </div>

              {startDate && endDate && (
                  <p
                      style={{
                          marginTop: "0.75rem",
                          color: hasConflict ? "#b91c1c" : "#166534",
                          backgroundColor: hasConflict ? "#fee2e2" : "#dcfce7",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                      }}
                  >
                      {hasConflict
                          ? `⚠️ Zeitraum voll belegt (${overlappingBookingsCount}/${place.capacity})`
                          : `✅ Zeitraum verfügbar (${overlappingBookingsCount}/${place.capacity} belegt)`}
                  </p>
              )}
              {isPermanentCamper && (
                  <p
                    style={{
                      marginTop: "0.75rem",
                      color: "#374151",
                      backgroundColor: "#e5e7eb",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                    }}
                  >
                    Dieser Platz ist als Dauercamper markiert und kann nicht gebucht werden.
                  </p>
                )}

              {errorMessage && (
                  <p
                      style={{
                          color: "#b91c1c",
                          marginTop: "0.75rem",
                          backgroundColor: "#fee2e2",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                      }}
                  >
                      {errorMessage}
                  </p>
              )}
          </div>

          {bookingToDelete !== null && (
              <div
                  style={{
                      position: "fixed",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1000,
                  }}
              >
                  <div
                      style={{
                          backgroundColor: "white",
                          borderRadius: "0.75rem",
                          padding: "1.25rem",
                          width: "100%",
                          maxWidth: "420px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                          border: "1px solid #e5e7eb",
                      }}
                  >
                      <h3 style={{marginTop: 0, marginBottom: "0.75rem", color: "#111827"}}>
                          Buchung stornieren
                      </h3>

                      <p style={{marginBottom: "1rem", color: "#374151"}}>
                          Möchtest du diese Buchung wirklich stornieren?
                      </p>

                      <div
                          style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "0.75rem",
                          }}
                      >
                          <button
                              onClick={cancelDeleteBooking}
                              style={{
                                  padding: "0.6rem 1rem",
                                  borderRadius: "0.5rem",
                                  border: "1px solid #d1d5db",
                                  backgroundColor: "white",
                                  color: "#111827",
                                  cursor: "pointer",
                              }}
                          >
                              Abbrechen
                          </button>

                          <button
                              onClick={confirmDeleteBooking}
                              style={{
                                  padding: "0.6rem 1rem",
                                  borderRadius: "0.5rem",
                                  border: "1px solid #dc2626",
                                  backgroundColor: "#dc2626",
                                  color: "white",
                                  cursor: "pointer",
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