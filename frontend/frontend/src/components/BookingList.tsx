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

export function BookingList({ bookings, onDelete }: BookingListProps) {
  const sortedBookings = [...bookings].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  if (sortedBookings.length === 0) {
    return <p style={{ color: "#111827" }}>Keine Buchungen für diesen Platz.</p>;
  }

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th
            style={{
              textAlign: "left",
              borderBottom: "1px solid #d1d5db",
              padding: "0.4rem 0.6rem",
              color: "#111827",
            }}
          >
            Von
          </th>
          <th
            style={{
              textAlign: "left",
              borderBottom: "1px solid #d1d5db",
              padding: "0.4rem 0.6rem",
              color: "#111827",
            }}
          >
            Bis
          </th>
          <th
            style={{
              textAlign: "left",
              borderBottom: "1px solid #d1d5db",
              padding: "0.4rem 0.6rem",
              color: "#111827",
            }}
          >
            Aktion
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedBookings.map((b) => (
          <tr key={b.id}>
            <td
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "0.4rem 0.6rem",
                color: "#111827",
              }}
            >
              {formatDate(b.start_date)}
            </td>
            <td
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "0.4rem 0.6rem",
                color: "#111827",
              }}
            >
              {formatDate(b.end_date)}
            </td>
            <td
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "0.4rem 0.6rem",
              }}
            >
              {onDelete && (
                <button
                  onClick={() => onDelete(b.id)}
                  style={{
                    padding: "0.45rem 0.8rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #dc2626",
                    backgroundColor: "#dc2626",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Storno
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}