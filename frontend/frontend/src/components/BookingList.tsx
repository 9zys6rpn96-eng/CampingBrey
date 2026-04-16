import type { Booking } from "../types";

interface BookingListProps {
  bookings: Booking[];
  onDelete?: (bookingId: number) => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStayLength(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return "0 Nächte";
  }

  return nights === 1 ? "1 Nacht" : `${nights} Nächte`;
}

export function BookingList({ bookings, onDelete }: BookingListProps) {
  const sortedBookings = [...bookings].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  if (sortedBookings.length === 0) {
    return (
      <p
        style={{
          color: "#6b7280",
          margin: 0,
          padding: "0.9rem 1rem",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "0.75rem",
        }}
      >
        Keine Buchungen für diesen Platz.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {sortedBookings.map((b) => (
        <div
          key={b.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.9rem",
            backgroundColor: "#ffffff",
            padding: "0.9rem 1rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#111827",
                  marginBottom: "0.3rem",
                }}
              >
                {b.guest_name}
              </div>

              <div
                style={{
                  color: "#374151",
                  marginBottom: "0.35rem",
                  fontSize: "0.95rem",
                }}
              >
                {formatDate(b.start_date)} – {formatDate(b.end_date)}
              </div>

              <div
                style={{
                  color: "#6b7280",
                  fontSize: "0.88rem",
                  marginBottom: b.vehicle_size || b.notes ? "0.55rem" : 0,
                }}
              >
                Aufenthalt: {getStayLength(b.start_date, b.end_date)}
              </div>

              {(b.vehicle_size || b.notes) && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    marginTop: "0.35rem",
                  }}
                >
                  {b.vehicle_size && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: "fit-content",
                        padding: "0.25rem 0.55rem",
                        borderRadius: "999px",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    >
                      🚐 {b.vehicle_size}
                    </div>
                  )}

                  {b.notes && (
                    <div
                      style={{
                        padding: "0.55rem 0.7rem",
                        borderRadius: "0.65rem",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        fontSize: "0.9rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {b.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {onDelete && (
              <button
                onClick={() => onDelete(b.id)}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "0.6rem",
                  border: "1px solid #dc2626",
                  backgroundColor: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Storno
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}