import type { Booking, Place } from "../types";

interface BookingOverviewProps {
  bookings: Booking[];
  places: Place[];
}

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDate(dateString: string) {
  return parseLocalDate(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStayLength(startDate: string, endDate: string) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const diffMs = end.getTime() - start.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (nights <= 0) return "0 Nächte";
  return nights === 1 ? "1 Nacht" : `${nights} Nächte`;
}

function escapeCsvValue(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function BookingOverview({ bookings, places }: BookingOverviewProps) {
  const sortedBookings = [...bookings].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  function getPlaceName(placeId: number) {
    return places.find((p) => p.id === placeId)?.name ?? `ID ${placeId}`;
  }

  function exportCsv() {
    const rows = [
      [
        "Platz",
        "Gast",
        "Von",
        "Bis",
        "Nächte",
        "Fahrzeuggröße",
        "Notizen",
      ],
      ...sortedBookings.map((booking) => [
        getPlaceName(booking.place_id),
        booking.guest_name,
        formatDate(booking.start_date),
        formatDate(booking.end_date),
        getStayLength(booking.start_date, booking.end_date),
        booking.vehicle_size || "",
        booking.notes || "",
      ]),
    ];

    const csvContent = rows
      .map((row) => row.map(escapeCsvValue).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `buchungen_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Alle Buchungen</h2>
          <p style={subtitleStyle}>
            Chronologische Übersicht aller aktuellen Buchungen.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={sortedBookings.length === 0}
          style={{
            ...exportButtonStyle,
            opacity: sortedBookings.length === 0 ? 0.55 : 1,
            cursor: sortedBookings.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          CSV exportieren
        </button>
      </div>

      {sortedBookings.length === 0 ? (
        <div style={emptyStyle}>Noch keine Buchungen vorhanden.</div>
      ) : (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Von</th>
                <th style={thStyle}>Bis</th>
                <th style={thStyle}>Platz</th>
                <th style={thStyle}>Gast</th>
                <th style={thStyle}>Nächte</th>
                <th style={thStyle}>Fahrzeug</th>
                <th style={thStyle}>Notizen</th>
              </tr>
            </thead>

            <tbody>
              {sortedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={tdStyle}>{formatDate(booking.start_date)}</td>
                  <td style={tdStyle}>{formatDate(booking.end_date)}</td>
                  <td style={tdStyle}>
                    <strong>Platz {getPlaceName(booking.place_id)}</strong>
                  </td>
                  <td style={tdStyle}>{booking.guest_name}</td>
                  <td style={tdStyle}>
                    {getStayLength(booking.start_date, booking.end_date)}
                  </td>
                  <td style={tdStyle}>{booking.vehicle_size || "–"}</td>
                  <td style={tdStyle}>{booking.notes || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d7e4db",
  borderRadius: "1rem",
  padding: "1rem",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  boxSizing: "border-box",
  marginBottom: "1rem",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.08rem",
  fontWeight: 800,
  color: "#163126",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0.3rem 0 0 0",
  color: "#5f766b",
  fontSize: "0.94rem",
};

const exportButtonStyle: React.CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid #15803d",
  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  color: "white",
  fontWeight: 700,
};

const emptyStyle: React.CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: "0.8rem",
  backgroundColor: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#5f766b",
};

const tableWrapperStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.92rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.75rem",
  borderBottom: "1px solid #d7e4db",
  color: "#5f766b",
  fontWeight: 800,
  backgroundColor: "#f8fafc",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderBottom: "1px solid #eef2f7",
  color: "#163126",
  verticalAlign: "top",
};