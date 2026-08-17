import type { BookingReceipt } from "../types";

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
  return Number(value).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function printBookingReceipt(receipt: BookingReceipt) {
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    throw new Error("Druckfenster konnte nicht geöffnet werden. Bitte Popups erlauben.");
  }

  try {
    const bookingInfo = receipt.booking_info ?? {
      adult_count: 0,
      child_count: 0,
      day_visitor_count: 0,
      car_count: 0,
      motorcycle_count: 0,
      camper_count: 0,
      camper_length_m: null,
      dog_count: 0,
      has_electricity: false,
      has_waste: false,
      has_rhine_view: false,
      vehicle_size: null,
      notes: null,
      created_by: null,
    };

    const infoRows = [
      ["Erwachsene", bookingInfo.adult_count],
      ["Kinder bis 14 Jahre", bookingInfo.child_count],
      ["Tagesbesucher", bookingInfo.day_visitor_count],
      ["Auto", bookingInfo.car_count],
      ["Motorrad", bookingInfo.motorcycle_count],
      ["Wohnmobil/Wohnwagen", bookingInfo.camper_count],
      ["Fahrzeuglaenge", bookingInfo.vehicle_size || (bookingInfo.camper_length_m ? `${bookingInfo.camper_length_m} m` : "-")],
      ["Hunde", bookingInfo.dog_count],
      ["Strom", bookingInfo.has_electricity ? "Ja" : "Nein"],
      ["Muell", bookingInfo.has_waste ? "Ja" : "Nein"],
      ["Rheinblick", bookingInfo.has_rhine_view ? "Ja" : "Nein"],
      ["Erstellt von", bookingInfo.created_by || "-"],
    ];

    const tableRows = receipt.items
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.description)}</td>
            <td class="num">${escapeHtml(item.quantity)}</td>
            <td>${escapeHtml(item.unit)}</td>
            <td class="num">${escapeHtml(formatEuro(item.unit_price))}</td>
            <td class="num">${escapeHtml(formatEuro(item.total))}</td>
          </tr>`
      )
      .join("");

    const detailRows = infoRows
      .map(
        ([label, value]) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td>${escapeHtml(value)}</td>
          </tr>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Buchungsbeleg ${escapeHtml(receipt.booking_number)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.35; }
    .receipt { width: 100%; max-width: 186mm; margin: 0 auto; box-sizing: border-box; }
    h1 { margin: 0 0 3mm 0; font-size: 17px; }
    h2 { margin: 0 0 2mm 0; font-size: 13px; }
    p { margin: 0 0 1.5mm 0; }
    .receipt-section { margin-bottom: 4mm; break-inside: avoid; page-break-inside: avoid; }
    .grid { display: table; width: 100%; table-layout: fixed; }
    .col { display: table-cell; vertical-align: top; width: 50%; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #ddd; padding: 1.6mm 1.2mm; text-align: left; vertical-align: top; }
    th { font-weight: 700; }
    .num { text-align: right; white-space: nowrap; }
    .meta td { border-bottom: 1px solid #eee; }
    .total-row td { font-weight: 700; border-top: 1px solid #999; }
    .muted { color: #555; }
  </style>
</head>
<body>
  <main class="receipt">
    <section class="receipt-section">
      <h2>Campingplatz Wilhelm</h2>
      <p class="muted">Brey am Rhein</p>
    </section>

    <section class="receipt-section">
      <h1>AUFENTHALTS- UND ABRECHNUNGSNACHWEIS</h1>
    </section>

    <section class="receipt-section grid">
      <div class="col">
        <h2>Gast</h2>
        <p>${escapeHtml(receipt.guest.name)}</p>
        <p>${escapeHtml(receipt.guest.street || "")}</p>
        <p>${escapeHtml([receipt.guest.postal_code, receipt.guest.city].filter(Boolean).join(" "))}</p>
      </div>
      <div class="col">
        <h2>Buchung</h2>
        <p><strong>Buchungsnummer:</strong> ${escapeHtml(receipt.booking_number)}</p>
        <p><strong>Stellplatz:</strong> ${escapeHtml(receipt.place.name)}</p>
        <p><strong>Anreise:</strong> ${escapeHtml(formatDate(receipt.stay.start_date))}</p>
        <p><strong>Abreise:</strong> ${escapeHtml(formatDate(receipt.stay.end_date))}</p>
        <p><strong>Naechte:</strong> ${escapeHtml(receipt.stay.nights)}</p>
      </div>
    </section>

    <section class="receipt-section">
      <h2>Buchungsinformationen</h2>
      <table class="meta">
        <tbody>${detailRows}</tbody>
      </table>
      ${bookingInfo.notes ? `<p style="margin-top:2mm;"><strong>Hinweis:</strong> ${escapeHtml(bookingInfo.notes)}</p>` : ""}
    </section>

    <section class="receipt-section">
      <h2>Leistungen</h2>
      <table>
        <thead>
          <tr>
            <th>Leistung</th>
            <th class="num">Menge</th>
            <th>Einheit</th>
            <th class="num">Einzelpreis</th>
            <th class="num">Gesamtpreis</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="total-row">
            <td>Gesamtbetrag</td>
            <td></td>
            <td></td>
            <td></td>
            <td class="num">${escapeHtml(formatEuro(receipt.total))}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="receipt-section">
      <p><strong>Zahlung:</strong> siehe gesonderter Kassenbeleg</p>
      <p>Vielen Dank fuer Ihren Aufenthalt.</p>
    </section>
  </main>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    console.log("Print HTML:", html);
    console.log("Print body:", printWindow.document.body?.innerHTML);

    let printTriggered = false;
    const triggerPrint = () => {
      if (printTriggered) return;
      printTriggered = true;
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    printWindow.onload = () => {
      triggerPrint();
    };

    // Fallback, falls onload im geschriebenen Dokument nicht feuert.
    setTimeout(() => {
      if ((printWindow.document.body?.innerHTML || "").trim() !== "") {
        triggerPrint();
      }
    }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fallbackHtml = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Druckfehler</title></head><body><pre>${escapeHtml(message)}</pre></body></html>`;
    printWindow.document.open();
    printWindow.document.write(fallbackHtml);
    printWindow.document.close();
    throw error;
  }
}




