import { useMemo, useState } from "react";
import type { Booking, Place } from "../types";
import { updateBooking } from "../services/api";
import { useViewport } from "../hooks/useViewport";

interface BookingOverviewProps {
  bookings: Booking[];
  places: Place[];
  onBookingUpdated: () => void | Promise<void>;
}

function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function getStatusLabel(status?: string) {
  if (status === "noshow") return "Nicht erschienen";
  if (status === "cancelled") return "Storniert";
  return "Aktiv";
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

export function BookingOverview({ bookings, places,onBookingUpdated }: BookingOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editPlaceId, setEditPlaceId] = useState<number | null>(null);
  const [editGuestName, setEditGuestName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editVehicleSize, setEditVehicleSize] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTentCount, setEditTentCount] = useState("1");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [hidePast, setHidePast] = useState(false);
  const { isMobile, isTablet } = useViewport();
  const sortedBookings = useMemo(
  () =>
    [...bookings].sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
    ),
  [bookings]
);

  const todayIso = new Date().toISOString().split("T")[0];

  function getPlaceName(placeId: number) {
    return places.find((p) => p.id === placeId)?.name ?? `ID ${placeId}`;
  }

  const filteredBookings = useMemo(() => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return sortedBookings.filter((booking) => {
    if (hidePast && booking.end_date <= todayIso) return false;

    if (!normalizedSearch) return true;
    const placeName = getPlaceName(booking.place_id);

    const searchableText = [
      booking.guest_name,
      placeName,
      `Platz ${placeName}`,
      booking.vehicle_size,
      booking.notes,
      booking.created_by,
      getStatusLabel(booking.status),
      booking.start_date,
      booking.end_date,
      formatDate(booking.start_date),
      formatDate(booking.end_date),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });
}, [searchTerm, sortedBookings, places, hidePast, todayIso]);

  function openEditDialog(booking: Booking) {
  setEditingBooking(booking);
  setEditPlaceId(booking.place_id);
  setEditGuestName(booking.guest_name);
  setEditStartDate(booking.start_date);
  setEditEndDate(booking.end_date);
  setEditVehicleSize(booking.vehicle_size || "");
  setEditNotes(booking.notes || "");
  setEditTentCount(String(booking.tent_count ?? 1));
  setEditError(null);
}

function closeEditDialog() {
  setEditingBooking(null);
  setEditPlaceId(null);
  setEditGuestName("");
  setEditStartDate("");
  setEditEndDate("");
  setEditVehicleSize("");
  setEditNotes("");
  setEditError(null);
}

async function handleSaveBooking() {
  if (!editingBooking || editPlaceId === null) {
    return;
  }

  if (!editGuestName.trim()) {
    setEditError("Bitte einen Gastnamen eingeben.");
    return;
  }

  if (!editStartDate || !editEndDate) {
    setEditError("Bitte Anreise und Abreise auswählen.");
    return;
  }

  if (editStartDate >= editEndDate) {
    setEditError("Die Abreise muss nach der Anreise liegen.");
    return;
  }

  try {
    setEditSaving(true);
    setEditError(null);

    await updateBooking(editingBooking.id, {
      place_id: editPlaceId,
      start_date: editStartDate,
      end_date: editEndDate,
      guest_name: editGuestName.trim(),
      vehicle_size: editVehicleSize.trim(),
      tent_count:
      places.find((p) => p.id === editPlaceId)?.type === "Zeltwiese"
        ? Number(editTentCount)
        : null,
      notes: editNotes.trim(),
    });

    await onBookingUpdated();
    closeEditDialog();
  } catch (err: any) {
    setEditError(err.message || "Fehler beim Bearbeiten der Buchung");
  } finally {
    setEditSaving(false);
  }
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
        "Erstellt von",
        "Status",
      ],
      ...filteredBookings.map((booking) => [
        getPlaceName(booking.place_id),
        booking.guest_name,
        formatDate(booking.start_date),
        formatDate(booking.end_date),
        getStayLength(booking.start_date, booking.end_date),
        booking.vehicle_size || "",
        booking.notes || "",
        booking.created_by || "",
        getStatusLabel(booking.status),
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
        <div
          style={{
            ...headerStyle,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          <div>
            <h2 style={titleStyle}>Alle Buchungen</h2>
            <p style={subtitleStyle}>
              Chronologische Übersicht aller aktuellen Buchungen.
            </p>
          </div>

          <button
              onClick={exportCsv}
              disabled={filteredBookings.length === 0}
              style={{
                ...exportButtonStyle,
                opacity: filteredBookings.length === 0 ? 0.55 : 1,
                cursor: filteredBookings.length === 0 ? "not-allowed" : "pointer",
              }}
          >
            CSV exportieren
          </button>

          <button
              onClick={() => setHidePast((prev) => !prev)}
              style={{
                ...togglePastButtonStyle,
                ...(hidePast ? togglePastButtonActiveStyle : {}),
              }}
          >
            {hidePast ? "🕐 Vergangene anzeigen" : "🗂️ Vergangene ausblenden"}
          </button>
        </div>

        <div style={searchWrapperStyle}>
          <label style={searchLabelStyle}>
            Buchungen durchsuchen
          </label>

          <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gast, Platz, Ersteller, Notiz oder Status suchen …"
              style={searchInputStyle}
          />

          {searchTerm.trim() && (
              <div style={searchResultStyle}>
                {filteredBookings.length} Buchung(en) gefunden
              </div>
          )}
        </div>

        {sortedBookings.length === 0 ? (
          <div style={emptyStyle}>Noch keine Buchungen vorhanden.</div>
        ) : filteredBookings.length === 0 ? (
          <div style={emptyStyle}>
            Keine passenden Buchungen gefunden.
          </div>
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
                  <th style={thStyle}>Fahrzeuglänge / Zeltgröße</th>
                  <th style={thStyle}>Notizen</th>
                  <th style={thStyle}>Erstellt von</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Aktion</th>
                </tr>
                </thead>

                <tbody>
                {filteredBookings.map((booking) => (
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

                      <td style={tdStyle}>{booking.created_by || "Unbekannt"}</td>

                      <td style={tdStyle}>{getStatusLabel(booking.status)}</td>

                      <td style={tdStyle}>
                        <button
                            type="button"
                            onClick={() => openEditDialog(booking)}
                            style={editButtonStyle}
                        >
                          Bearbeiten
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
        {editingBooking && (
  <div style={modalOverlayStyle}>
    <div style={modalCardStyle}>
      <div style={modalHeaderStyle}>
        <div>
          <h3 style={modalTitleStyle}>Buchung bearbeiten</h3>
          <p style={modalSubtitleStyle}>
            Buchung #{editingBooking.id} anpassen.
          </p>
        </div>

        <button
          type="button"
          onClick={closeEditDialog}
          style={closeButtonStyle}
          aria-label="Dialog schließen"
        >
          ✕
        </button>
      </div>

        <div
          style={{
            ...editFormGridStyle,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
                ? "repeat(2, minmax(0, 1fr))"
                : editFormGridStyle.gridTemplateColumns,
          }}
        >
        <div>
          <label style={formLabelStyle}>Platz</label>
          <select
            value={editPlaceId ?? ""}
            onChange={(e) => setEditPlaceId(Number(e.target.value))}
            style={formInputStyle}
          >
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                Platz {place.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={formLabelStyle}>Gastname</label>
          <input
            value={editGuestName}
            onChange={(e) => setEditGuestName(e.target.value)}
            style={formInputStyle}
          />
        </div>

        <div>
          <label style={formLabelStyle}>Anreise</label>
          <input
            type="date"
            value={editStartDate}
            onChange={(e) => setEditStartDate(e.target.value)}
            style={formInputStyle}
          />
        </div>

        <div>
          <label style={formLabelStyle}>Abreise</label>
          <input
            type="date"
            value={editEndDate}
            onChange={(e) => setEditEndDate(e.target.value)}
            style={formInputStyle}
          />
        </div>

        <div>
          <label style={formLabelStyle}>
            {places.find((p) => p.id === editPlaceId)?.type === "Zeltwiese"
              ? "⛺ Zeltgröße"
              : "🚐 Fahrzeuglänge"}
          </label>

          <input
            value={editVehicleSize}
            onChange={(e) => setEditVehicleSize(e.target.value)}
            style={formInputStyle}
          />
        </div>

        {places.find((p) => p.id === editPlaceId)?.type === "Zeltwiese" && (
          <div>
            <label style={formLabelStyle}>🏕️ Anzahl Zelte</label>

            <input
              type="number"
              min="1"
              value={editTentCount}
              onChange={(e) => setEditTentCount(e.target.value)}
              style={formInputStyle}
            />
          </div>
        )}

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={formLabelStyle}>Notizen</label>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            style={formTextareaStyle}
            rows={4}
          />
        </div>
      </div>

      {editError && (
        <div style={modalErrorStyle}>
          {editError}
        </div>
      )}

      <div style={modalActionsStyle}>
        <button
          type="button"
          onClick={closeEditDialog}
          disabled={editSaving}
          style={cancelButtonStyle}
        >
          Abbrechen
        </button>

        <button
          type="button"
          onClick={handleSaveBooking}
          disabled={editSaving}
          style={{
            ...saveButtonStyle,
            opacity: editSaving ? 0.65 : 1,
            cursor: editSaving ? "not-allowed" : "pointer",
          }}
        >
          {editSaving ? "Speichert …" : "Änderungen speichern"}
        </button>
      </div>
    </div>
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

const searchWrapperStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const searchLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.4rem",
  color: "#5f766b",
  fontSize: "0.9rem",
  fontWeight: 700,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 0.9rem",
  border: "1px solid #bfd4c7",
  borderRadius: "0.75rem",
  backgroundColor: "#ffffff",
  color: "#163126",
  boxSizing: "border-box",
  outline: "none",
};

const searchResultStyle: React.CSSProperties = {
  marginTop: "0.4rem",
  color: "#6b7280",
  fontSize: "0.85rem",
};

const editButtonStyle: React.CSSProperties = {
  padding: "0.45rem 0.7rem",
  borderRadius: "0.6rem",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#166534",
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  backgroundColor: "rgba(15, 23, 42, 0.45)",
};

const modalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "720px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "1.25rem",
  borderRadius: "1rem",
  backgroundColor: "#ffffff",
  border: "1px solid #d7e4db",
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1rem",
  marginBottom: "1rem",
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.2rem",
  color: "#163126",
};

const modalSubtitleStyle: React.CSSProperties = {
  margin: "0.3rem 0 0 0",
  color: "#6b7280",
};

const closeButtonStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "transparent",
  color: "#6b7280",
  cursor: "pointer",
  fontSize: "1.1rem",
  padding: "0.25rem",
};

const editFormGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.9rem",
};

const formLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.35rem",
  color: "#5f766b",
  fontSize: "0.9rem",
  fontWeight: 700,
};

const formInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.82rem",
  border: "1px solid #bfd4c7",
  borderRadius: "0.75rem",
  backgroundColor: "#ffffff",
  color: "#163126",
  boxSizing: "border-box",
};

const formTextareaStyle: React.CSSProperties = {
  ...formInputStyle,
  resize: "vertical",
  fontFamily: "inherit",
};

const modalErrorStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.75rem 0.9rem",
  borderRadius: "0.75rem",
  backgroundColor: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginTop: "1.2rem",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#163126",
  cursor: "pointer",
  fontWeight: 700,
};

const saveButtonStyle: React.CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid #15803d",
  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  color: "#ffffff",
  fontWeight: 700,
};

const togglePastButtonStyle: React.CSSProperties = {
  padding: "0.72rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#355447",
  cursor: "pointer",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const togglePastButtonActiveStyle: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#059669",
};
