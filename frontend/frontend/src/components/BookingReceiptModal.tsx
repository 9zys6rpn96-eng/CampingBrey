import type { BookingReceipt } from "../types";
import { printBookingReceipt } from "../utils/printBookingReceipt";

interface BookingReceiptModalProps {
  receipt: BookingReceipt;
  onClose: () => void;
}

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatEuro(value: number) {
  const numericValue = Number(value);
  return numericValue.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeReceiptUiText(value: string) {
  return value
    .replace(/Muellpauschale/g, "Müllpauschale")
    .replace(/Muell/g, "Müll")
    .replace(/muellpauschale/g, "müllpauschale")
    .replace(/muell/g, "müll");
}

export function BookingReceiptModal({ receipt, onClose }: BookingReceiptModalProps) {
  return (
    <div style={overlayStyle} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalCardStyle}>
        <div style={actionsStyle}>
          <button type="button" onClick={() => printBookingReceipt(receipt)} style={printButtonStyle}>
            Abrechnung drucken / als PDF speichern
          </button>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Schließen
          </button>
        </div>

        <div style={paperStyle}>
          <div style={headerBrandStyle}>Campingplatz Wilhelm</div>
          <div style={headerLocationStyle}>Brey am Rhein</div>

          <h1 style={titleStyle}>AUFENTHALTS- UND ABRECHNUNGSBELEG</h1>

          <section style={sectionStyle}>
            <div style={sectionLabelStyle}>Gast:</div>
            <div>{receipt.guest.name}</div>
            {receipt.guest.street && <div>{receipt.guest.street}</div>}
            <div>
              {[receipt.guest.postal_code, receipt.guest.city].filter(Boolean).join(" ") || "-"}
            </div>
            {receipt.guest.nationality && <div>Land: {receipt.guest.nationality}</div>}
          </section>

          <section style={sectionStyleRowStyle}>
            <div>
              <div style={sectionLabelStyle}>Buchungsnummer:</div>
              <div>{receipt.booking_number}</div>
              <div style={{ marginTop: "0.3rem" }}>
                <strong>Stellplatz:</strong> {receipt.place.name}
              </div>
            </div>
            <div>
              <div style={sectionLabelStyle}>Aufenthalt:</div>
              <div>
                {formatDate(receipt.stay.start_date)} - {formatDate(receipt.stay.end_date)}
              </div>
              <div>
                {receipt.stay.nights} {receipt.stay.nights === 1 ? "Übernachtung" : "Übernachtungen"}
              </div>
            </div>
          </section>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thLeftStyle}>Leistung</th>
                <th style={thRightStyle}>Menge</th>
                <th style={thLeftStyle}>Einheit</th>
                <th style={thRightStyle}>Einzelpreis</th>
                <th style={thRightStyle}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={`${item.description}-${item.quantity}`}>
                  <td style={tdLeftStyle}>{normalizeReceiptUiText(item.description)}</td>
                  <td style={tdRightStyle}>{item.quantity}</td>
                  <td style={tdLeftStyle}>{item.unit}</td>
                  <td style={tdRightStyle}>{formatEuro(item.unit_price)}</td>
                  <td style={tdRightStyle}>{formatEuro(item.total)}</td>
                </tr>
              ))}
              <tr>
                <td style={totalLabelStyle}>Gesamt</td>
                <td style={totalCellStyle} />
                <td style={totalCellStyle} />
                <td style={totalCellStyle} />
                <td style={totalAmountStyle}>{formatEuro(receipt.total)}</td>
              </tr>
            </tbody>
          </table>

          <section style={sectionStyle}>
            <div style={sectionLabelStyle}>Zahlung:</div>
            <div>siehe gesonderten Kassenbeleg</div>
          </section>

          <p style={footerTextStyle}>Vielen Dank für Ihren Aufenthalt.</p>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
};

const modalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "980px",
  maxHeight: "95vh",
  overflow: "auto",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  boxShadow: "0 24px 50px rgba(0,0,0,0.2)",
  border: "1px solid #d7e4db",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.6rem",
  padding: "1rem",
  borderBottom: "1px solid #e5e7eb",
};

const printButtonStyle: React.CSSProperties = {
  padding: "0.65rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid #15803d",
  background: "#15803d",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const closeButtonStyle: React.CSSProperties = {
  padding: "0.65rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid #bfd4c7",
  backgroundColor: "#fff",
  color: "#163126",
  fontWeight: 700,
  cursor: "pointer",
};

const paperStyle: React.CSSProperties = {
  width: "210mm",
  maxWidth: "100%",
  minHeight: "297mm",
  margin: "0 auto",
  padding: "16mm",
  color: "#111827",
  backgroundColor: "#fff",
};

const headerBrandStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 800,
};

const headerLocationStyle: React.CSSProperties = {
  marginTop: "0.2rem",
  fontSize: "0.98rem",
  marginBottom: "1.5rem",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  margin: "0 0 1.2rem 0",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "1rem",
  lineHeight: 1.5,
};

const sectionStyleRowStyle: React.CSSProperties = {
  marginBottom: "1.2rem",
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
};

const sectionLabelStyle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: "0.2rem",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "1rem",
  fontSize: "0.95rem",
};

const thLeftStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #cbd5e1",
};

const thRightStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "0.5rem",
  borderBottom: "1px solid #cbd5e1",
};

const tdLeftStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderBottom: "1px solid #e5e7eb",
};

const tdRightStyle: React.CSSProperties = {
  padding: "0.5rem",
  textAlign: "right",
  borderBottom: "1px solid #e5e7eb",
};

const totalLabelStyle: React.CSSProperties = {
  ...tdLeftStyle,
  fontWeight: 800,
};

const totalCellStyle: React.CSSProperties = {
  ...tdRightStyle,
};

const totalAmountStyle: React.CSSProperties = {
  ...tdRightStyle,
  fontWeight: 800,
};

const footerTextStyle: React.CSSProperties = {
  marginTop: "1.5rem",
};


