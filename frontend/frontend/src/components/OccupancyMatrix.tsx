import { useMemo, useRef, useState } from "react";
import type { Place, Booking, PlaceStatus } from "../types";

interface OccupancyMatrixProps {
  places: Place[];
  bookings: Booking[];
  placeStatuses: PlaceStatus[];
  selectedPlaceId: number | null;
  onSelectPlace: (
    id: number,
    options?: {
      focusDateIso?: string;
      focusBookingId?: number;
      preferredTab?: "booking" | "details";
      forceOpen?: boolean;
    }
  ) => void;
  onSelectDateRange?: (placeId: number, startDate: string, endDate?: string) => void;
  isDeveloper: boolean;
  availablePlaceIds?: number[];
  availabilityMode?: boolean;
}

// Hilfsfunktionen für Datumsverwaltung
function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseIsoDate(isoString: string) {
  const [year, month, day] = isoString.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateShort(date: Date) {
  const weekday = date.toLocaleDateString("de-DE", {
    weekday: "short",
  }).replace(/,$/, "");
  const dayMonth = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${weekday} ${dayMonth}`;
}

function formatDateFull(date: Date) {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysBetweenIso(startIso: string, endIso: string) {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / msPerDay));
}

function minIsoDate(a: string, b: string) {
  return a <= b ? a : b;
}

const DAY_CELL_WIDTH = 120;
const INITIAL_DAY_COUNT = 45;
const DAY_LOAD_CHUNK = 30;
const RIGHT_EDGE_LOAD_THRESHOLD_PX = 420;

function isZeltwiese(place: Place): boolean {
  return place.type === "Zeltwiese";
}

// Funktion zur Berechnung der Auslastung der Zeltwiese für einen Tag
function getZeltwieseOccupancyForDay(
  bookings: Booking[],
  placeId: number,
  dateIso: string,
  placeCapacity: number
): { occupied: number; capacity: number } {
  const occupied = bookings
    .filter(
      (b) =>
        b.place_id === placeId &&
        b.start_date <= dateIso &&
        dateIso < b.end_date
    )
    .reduce((sum, b) => sum + (b.tent_count ?? 1), 0);

  return { occupied, capacity: placeCapacity };
}

// Funktion zur Berechnung der Schreibweise
function getOccupancyColor(occupied: number, capacity: number): string {
  if (occupied === 0) return "green";
  if (occupied >= capacity) return "red";
  return "yellow";
}

// Tooltip-Komponente
function Tooltip({
  x,
  y,
  content,
}: {
  x: number;
  y: number;
  content: React.ReactNode;
}) {
  // Adjust position if tooltip would go off-screen
  const tooltipWidth = 280;
  const adjustedX = window.innerWidth - x < tooltipWidth + 20
    ? x - tooltipWidth - 10
    : x - tooltipWidth / 2;

  return (
    <div
      style={{
        position: "fixed",
        left: `${Math.max(10, adjustedX)}px`,
        top: `${y}px`,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        border: "1px solid #d7e4db",
        borderRadius: "8px",
        padding: "12px 14px",
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.18)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        maxWidth: "280px",
        fontSize: "0.85rem",
        color: "#1f2937",
        lineHeight: "1.4",
        pointerEvents: "none",
      }}
    >
      {content}
    </div>
  );
}

export function OccupancyMatrix({
  places,
  bookings,
  selectedPlaceId,
  onSelectPlace,
  onSelectDateRange,
}: OccupancyMatrixProps) {
  const [viewStartDate, setViewStartDate] = useState(() => toIsoDate(new Date()));
  const [dayCount, setDayCount] = useState(INITIAL_DAY_COUNT);
  const [hoveredCell, setHoveredCell] = useState<{
    placeId: number;
    dateIso: string;
    x: number;
    y: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAppendingDaysRef = useRef(false);

  // Berechne Tage im sichtbaren Fenster
  const daysInView = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < dayCount; i++) {
      const d = addDays(parseIsoDate(viewStartDate), i);
      days.push(toIsoDate(d));
    }
    return days;
  }, [viewStartDate, dayCount]);

  // Berechne Buchungen gruppiert nach Platz
  const bookingsByPlace = useMemo(() => {
    const map = new Map<number, Booking[]>();
    places.forEach((p) => {
      map.set(p.id, bookings.filter((b) => b.place_id === p.id));
    });
    return map;
  }, [bookings, places]);

  const handleNavigationPrevious = () => {
    setViewStartDate(toIsoDate(addDays(parseIsoDate(viewStartDate), -7)));
  };

  const handleNavigationToday = () => {
    setDayCount(INITIAL_DAY_COUNT);
    setViewStartDate(toIsoDate(new Date()));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  const handleNavigationNext = () => {
    setViewStartDate(toIsoDate(addDays(parseIsoDate(viewStartDate), 7)));
  };

  const handleHorizontalScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || isAppendingDaysRef.current) return;

    const remaining = el.scrollWidth - (el.scrollLeft + el.clientWidth);
    if (remaining > RIGHT_EDGE_LOAD_THRESHOLD_PX) return;

    isAppendingDaysRef.current = true;
    setDayCount((prev) => prev + DAY_LOAD_CHUNK);
    window.requestAnimationFrame(() => {
      isAppendingDaysRef.current = false;
    });
  };

  const todayIso = toIsoDate(new Date());
  const viewEndExclusiveIso = toIsoDate(
    addDays(parseIsoDate(daysInView[daysInView.length - 1]), 1)
  );

  return (
    <div style={matrixContainerStyle}>
      {/* Header mit Navigation */}
      <div style={matrixHeaderStyle}>
        <div style={matrixNavigationStyle}>
          <button
            onClick={handleNavigationPrevious}
            style={navButtonStyle}
            title="Vorherige Woche"
          >
            ← Zurück
          </button>
          <button
            onClick={handleNavigationToday}
            style={navButtonStyle}
            title="Zu heute"
          >
            Heute
          </button>
          <button
            onClick={handleNavigationNext}
            style={navButtonStyle}
            title="Nächste Woche"
          >
            Weiter →
          </button>
          <span style={dateRangeStyle}>
            {formatDateFull(parseIsoDate(viewStartDate))} –{" "}
            {formatDateFull(
              parseIsoDate(daysInView[daysInView.length - 1])
            )}
          </span>
        </div>

        {/* Legende */}
        <div style={legendRowStyle}>
          <div style={legendItemStyle}>
            <span
              style={{
                ...legendDotStyle,
                backgroundColor: "rgba(34,197,94,0.6)",
              }}
            />
            Frei
          </div>
          <div style={legendItemStyle}>
            <span
              style={{
                ...legendDotStyle,
                backgroundColor: "rgba(234,179,8,0.6)",
              }}
            />
            Teilweise belegt
          </div>
          <div style={legendItemStyle}>
            <span
              style={{
                ...legendDotStyle,
                backgroundColor: "rgba(220,38,38,0.6)",
              }}
            />
            Belegt / Voll
          </div>
        </div>
      </div>

      {/* Matrix-Container mit Horizontal-Scroll */}
      <div
        style={scrollContainerStyle}
        ref={scrollContainerRef}
        onScroll={handleHorizontalScroll}
      >
        <div style={matrixGridWrapperStyle}>
          {/* Platznamen-Spalte (sticky) */}
          <div style={placeNamesColumnStyle}>
            <div style={headerCellPlaceStyle}>
              <span style={placeHeaderLabelStyle}>Platz</span>
            </div>
            {places.map((place) => (
              <div
                key={place.id}
                style={{
                  ...placeRowStyle,
                  ...(selectedPlaceId === place.id
                    ? selectedPlaceRowStyle
                    : {}),
                }}
                onClick={() => onSelectPlace(place.id)}
              >
                <div style={placeNameStyle}>{place.name}</div>
              </div>
            ))}
          </div>

          {/* Tage und Buchungen */}
          <div style={daysGridContainerStyle}>
            {/* Datumszeile (sticky oben) */}
            <div style={dateHeaderRowStyle}>
              {daysInView.map((dateIso) => {
                const date = parseIsoDate(dateIso);
                const isToday = dateIso === todayIso;

                return (
                  <div
                    key={`date-${dateIso}`}
                    style={{
                      ...dateHeaderCellStyle,
                      ...(isToday ? todayDateHeaderCellStyle : {}),
                    }}
                  >
                    <div style={dateHeaderDayStyle}>
                      {formatDateShort(date)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platz-Reihen */}
            {places.map((place) => (
              <div key={`place-row-${place.id}`} style={placeRowGridStyle}>
                {daysInView.map((dateIso) => {
                  const isToday = dateIso === todayIso;
                  const placeBookings = bookingsByPlace.get(place.id) || [];

                  // Finde Buchung, die diesen Tag abdeckt
                  const bookingForDay = placeBookings.find(
                    (b) => b.start_date <= dateIso && dateIso < b.end_date
                  );

                  let cellBackgroundColor = "transparent";
                  let cellBorderColor = "#e2e8f0";

                  if (isToday) {
                    cellBorderColor = "#2563eb";
                    cellBackgroundColor = "rgba(37, 99, 235, 0.05)";
                  }

                  // Für Zeltwiese
                  if (isZeltwiese(place)) {
                    const occ = getZeltwieseOccupancyForDay(
                      bookings,
                      place.id,
                      dateIso,
                      place.capacity
                    );
                    const occColor = getOccupancyColor(
                      occ.occupied,
                      occ.capacity
                    );

                    let bgColor = "rgba(34,197,94,0.1)";
                    if (occColor === "yellow") bgColor = "rgba(234,179,8,0.2)";
                    if (occColor === "red") bgColor = "rgba(220,38,38,0.25)";

                    return (
                      <div
                        key={`cell-${place.id}-${dateIso}`}
                        style={{
                          ...cellStyle,
                          backgroundColor: bgColor,
                          borderColor: isToday ? "#2563eb" : cellBorderColor,
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            placeId: place.id,
                            dateIso,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (onSelectDateRange) {
                            onSelectDateRange(place.id, dateIso);
                          }
                        }}
                      >
                        <div style={zeltwieseCellContentStyle}>
                          {getZeltwieseOccupancyForDay(
                            bookings,
                            place.id,
                            dateIso,
                            place.capacity
                          ).occupied === 0
                            ? "frei"
                            : `${
                                getZeltwieseOccupancyForDay(
                                  bookings,
                                  place.id,
                                  dateIso,
                                  place.capacity
                                ).occupied
                              }/${place.capacity}`}
                        </div>
                      </div>
                    );
                  }

                  // Für normale Plätze - mit Buchungsbalken
                  const isFirstVisibleDay = dateIso === daysInView[0];
                  const isBookingSegmentStart = Boolean(
                    bookingForDay &&
                      (bookingForDay.start_date === dateIso ||
                        (isFirstVisibleDay && bookingForDay.start_date < dateIso))
                  );

                  const isBookingActualStart = Boolean(
                    bookingForDay && bookingForDay.start_date === dateIso
                  );

                  const bookingVisibleEndIso = bookingForDay
                    ? minIsoDate(bookingForDay.end_date, viewEndExclusiveIso)
                    : dateIso;

                  const bookingSpanDays = bookingForDay
                    ? Math.max(1, daysBetweenIso(dateIso, bookingVisibleEndIso))
                    : 1;

                  const isBookingVisibleEnd = Boolean(
                    bookingForDay && bookingForDay.end_date <= viewEndExclusiveIso
                  );

                  return (
                    <div
                      key={`cell-${place.id}-${dateIso}`}
                      style={{
                        ...cellStyle,
                        backgroundColor: cellBackgroundColor,
                        borderColor: isToday ? "#2563eb" : cellBorderColor,
                        position: "relative",
                        overflow: "visible",
                      }}
                      onClick={() => {
                        if (!bookingForDay && onSelectDateRange) {
                          onSelectDateRange(place.id, dateIso);
                        }
                      }}
                    >
                      {/* Buchungsbalken wird pro zusammenhaengendem Segment nur einmal gerendert. */}
                      {bookingForDay && isBookingSegmentStart && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            backgroundColor: "rgba(220,38,38,0.75)",
                            width: `${bookingSpanDays * DAY_CELL_WIDTH}px`,
                            height: "24px",
                            borderRadius: isBookingActualStart
                              ? isBookingVisibleEnd
                                ? "4px"
                                : "4px 0 0 4px"
                              : isBookingVisibleEnd
                                ? "0 4px 4px 0"
                                : "0",
                            borderLeft: isBookingActualStart
                              ? "2px solid rgba(255, 255, 255, 0.8)"
                              : "none",
                            borderRight: isBookingVisibleEnd
                              ? "1px solid rgba(180,0,0,0.5)"
                              : "none",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            overflow: "hidden",
                            padding: "0 6px",
                            boxSizing: "border-box",
                            zIndex: 2,
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relativeX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
                            const dayOffset = Math.min(
                              bookingSpanDays - 1,
                              Math.max(0, Math.floor(relativeX / DAY_CELL_WIDTH))
                            );
                            setHoveredCell({
                              placeId: place.id,
                              dateIso: toIsoDate(addDays(parseIsoDate(dateIso), dayOffset)),
                              x: rect.left + rect.width / 2,
                              y: rect.top - 10,
                            });
                          }}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relativeX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
                            const dayOffset = Math.min(
                              bookingSpanDays - 1,
                              Math.max(0, Math.floor(relativeX / DAY_CELL_WIDTH))
                            );
                            setHoveredCell({
                              placeId: place.id,
                              dateIso: toIsoDate(addDays(parseIsoDate(dateIso), dayOffset)),
                              x: e.clientX,
                              y: e.clientY - 16,
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredCell(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relativeX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
                            const dayOffset = Math.min(
                              bookingSpanDays - 1,
                              Math.max(0, Math.floor(relativeX / DAY_CELL_WIDTH))
                            );
                            onSelectPlace(place.id, {
                              focusDateIso: toIsoDate(addDays(parseIsoDate(dateIso), dayOffset)),
                              focusBookingId: bookingForDay.id,
                              preferredTab: "details",
                              forceOpen: true,
                            });
                          }}
                        >
                          <span style={bookingBarTextStyle}>{bookingForDay.guest_name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <Tooltip
          x={hoveredCell.x}
          y={hoveredCell.y}
          content={
            <div>
              <div style={{ fontWeight: 700, marginBottom: "6px", fontSize: "0.9rem" }}>
                {places.find((p) => p.id === hoveredCell.placeId)?.name}
              </div>
              <div style={{ marginBottom: "8px", fontSize: "0.8rem", color: "#6b7280" }}>
                {formatDateFull(parseIsoDate(hoveredCell.dateIso))}
              </div>

              {isZeltwiese(
                places.find((p) => p.id === hoveredCell.placeId)!
              ) ? (
                <div>
                  {(() => {
                    const occ = getZeltwieseOccupancyForDay(
                      bookings,
                      hoveredCell.placeId,
                      hoveredCell.dateIso,
                      places.find((p) => p.id === hoveredCell.placeId)
                        ?.capacity || 0
                    );
                    const zeltwieseBookings = bookings.filter(
                      (b) =>
                        b.place_id === hoveredCell.placeId &&
                        b.start_date <= hoveredCell.dateIso &&
                        hoveredCell.dateIso < b.end_date
                    );

                    return (
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {occ.occupied} von {occ.capacity} belegt
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "0.8rem", color: "#6b7280" }}>
                          {occ.capacity - occ.occupied} frei
                        </div>
                        {zeltwieseBookings.length > 0 && (
                          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                            <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.75rem", textTransform: "uppercase", color: "#6b7280" }}>
                              Buchungen
                            </div>
                            {zeltwieseBookings.slice(0, 3).map((b) => (
                              <div key={b.id} style={{ marginTop: "4px", fontSize: "0.8rem" }}>
                                <div style={{ fontWeight: 600 }}>• {b.guest_name}</div>
                              </div>
                            ))}
                            {zeltwieseBookings.length > 3 && (
                              <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic" }}>
                                + {zeltwieseBookings.length - 3} weitere
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  {bookings
                    .filter(
                      (b) =>
                        b.place_id === hoveredCell.placeId &&
                        b.start_date <= hoveredCell.dateIso &&
                        hoveredCell.dateIso < b.end_date
                    )
                    .map((b) => (
                      <div key={b.id} style={{ marginTop: "0" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{b.guest_name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "2px" }}>
                          {formatDateFull(parseIsoDate(b.start_date))} –{" "}
                          {formatDateFull(parseIsoDate(b.end_date))}
                        </div>
                        {b.booking_number && (
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            # {b.booking_number}
                          </div>
                        )}
                        {(b.people_count || b.adult_count) && (
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {b.adult_count || b.people_count} {(b.adult_count || b.people_count) === 1 ? "Person" : "Personen"}
                            {b.child_count && b.child_count > 0 && ` + ${b.child_count} Kinder`}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}

// Styles
const matrixContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  height: "auto",
  overflowX: "hidden",
};

const matrixHeaderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  paddingBottom: "1rem",
  borderBottom: "1px solid #e2e8f0",
};

const matrixNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  alignItems: "center",
  flexWrap: "wrap",
};

const navButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderRadius: "0.5rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
  color: "#163126",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
  transition: "all 0.2s ease",
};

const dateRangeStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#355447",
  fontSize: "0.95rem",
};

const legendRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1.5rem",
  flexWrap: "wrap",
};

const legendItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.85rem",
  color: "#355447",
  fontWeight: 600,
};

const legendDotStyle: React.CSSProperties = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
};

const scrollContainerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "auto",
  boxSizing: "border-box",
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  maxHeight: "700px",
};

const matrixGridWrapperStyle: React.CSSProperties = {
  display: "flex",
  maxWidth: "none",
  minWidth: "min-content",
  width: "max-content",
};

const placeNamesColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  position: "sticky",
  left: 0,
  zIndex: 11,
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e2e8f0",
  minWidth: "140px",
};

const headerCellPlaceStyle: React.CSSProperties = {
  height: "60px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  position: "sticky",
  top: 0,
  left: 0,
  zIndex: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  color: "#355447",
  fontSize: "0.85rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const placeHeaderLabelStyle: React.CSSProperties = {
  whiteSpace: "nowrap",
};

const placeRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "80px",
  padding: "0.5rem",
  borderBottom: "1px solid #e2e8f0",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
};

const selectedPlaceRowStyle: React.CSSProperties = {
  backgroundColor: "rgba(37, 99, 235, 0.1)",
  borderLeft: "3px solid #2563eb",
};

const placeNameStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#163126",
  fontSize: "0.9rem",
  textAlign: "center",
};

const daysGridContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  flex: "0 0 auto",
};

const dateHeaderRowStyle: React.CSSProperties = {
  display: "flex",
  backgroundColor: "#f8fafc",
  borderBottom: "2px solid #d7e4db",
  position: "sticky",
  top: 0,
  zIndex: 12,
};

const dateHeaderCellStyle: React.CSSProperties = {
  flex: "0 0 120px",
  padding: "0.5rem",
  textAlign: "center",
  borderRight: "1px solid #e2e8f0",
  minHeight: "60px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f8fafc",
};

const todayDateHeaderCellStyle: React.CSSProperties = {
  backgroundColor: "rgba(37, 99, 235, 0.1)",
  borderLeft: "2px solid #2563eb",
};

const dateHeaderDayStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
};


const placeRowGridStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #e2e8f0",
};

const cellStyle: React.CSSProperties = {
  flex: "0 0 120px",
  height: "80px",
  padding: "0.5rem",
  borderRight: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
};

const zeltwieseCellContentStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#163126",
  fontSize: "0.85rem",
  textAlign: "center",
};

const bookingBarTextStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "0.84rem",
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
  textAlign: "center",
  lineHeight: 1.1,
};























