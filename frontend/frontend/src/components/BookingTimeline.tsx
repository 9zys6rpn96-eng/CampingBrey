import type { Booking } from "../types";

interface BookingTimelineProps {
  bookings: Booking[];
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function BookingTimeline({ bookings }: BookingTimelineProps) {
  const sortedBookings = [...bookings].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  if (sortedBookings.length === 0) {
    return (
      <p style={{ color: "#6b7280", margin: 0 }}>
        Noch keine Belegungszeiträume vorhanden.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {sortedBookings.map((booking) => (
        <div
          key={booking.id}
          style={{
            padding: "0.65rem 0.9rem",
            borderRadius: "0.75rem",
            backgroundColor: "#dbeafe",
            border: "1px solid #93c5fd",
            color: "#1e3a8a",
            fontWeight: 500,
          }}
        >
          {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
        </div>
      ))}
    </div>
  );
}