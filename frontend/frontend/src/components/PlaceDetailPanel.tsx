import { useState } from "react";
import type { Place, Booking } from "../types";
import { BookingList } from "./BookingList";
import { BookingTimeline } from "./BookingTimeline";
import { createBooking, deleteBooking } from "../services/api";

interface Props {
  place: Place | null;
  bookings: Booking[];
  onBookingCreated: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PlaceDetailPanel({ place, bookings, onBookingCreated }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

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

  const hasConflict =
    !!startDate &&
    !!endDate &&
    bookings.some((b) => startDate < b.end_date && endDate > b.start_date);

  async function handleSubmit() {
    if (!startDate || !endDate) {
      setErrorMessage("Bitte Start- und Enddatum auswählen.");
      return;
    }

    try {
      setErrorMessage(null);

      await createBooking({
        place_id: place.id,
        start_date: startDate,
        end_date: endDate,
      });

      await onBookingCreated();
      setStartDate("");
      setEndDate("");
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
      <h2 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#111827" }}>
        Platz: {place.name}{" "}
        {place.type && <span style={{ opacity: 0.7 }}>({place.type})</span>}
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
          <>
            Nächste Buchung ab <strong>{formatDate(nextBooking.start_date)}</strong>
          </>
        ) : (
          <>Keine zukünftigen Buchungen</>
        )}
      </div>

      <h3 style={{ marginBottom: "0.5rem", color: "#111827" }}>
        Belegungsübersicht
      </h3>
      <BookingTimeline bookings={bookings} />

      <h3
        style={{
          marginTop: "1.25rem",
          marginBottom: "0.5rem",
          color: "#111827",
        }}
      >
        Buchungen
      </h3>
      <BookingList bookings={bookings} onDelete={requestDeleteBooking} />

      <div
        style={{
          marginTop: "1.5rem",
          paddingTop: "1rem",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ marginBottom: "0.75rem", color: "#111827" }}>
          Neue Buchung
        </h3>

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

          <div style={{ alignSelf: "end" }}>
            <button
              onClick={handleSubmit}
              disabled={!startDate || !endDate || hasConflict}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #2563eb",
                backgroundColor:
                  !startDate || !endDate || hasConflict ? "#9ca3af" : "#2563eb",
                color: "white",
                cursor:
                  !startDate || !endDate || hasConflict ? "not-allowed" : "pointer",
                opacity: !startDate || !endDate || hasConflict ? 0.7 : 1,
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
              ? "⚠️ Zeitraum überschneidet sich mit bestehender Buchung"
              : "✅ Zeitraum verfügbar"}
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
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem", color: "#111827" }}>
              Buchung stornieren
            </h3>

            <p style={{ marginBottom: "1rem", color: "#374151" }}>
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