import { useEffect, useMemo, useRef, useState } from "react";
import type { Place, Booking } from "../types";

interface CampingMapProps {
  places: Place[];
  bookings: Booking[];
  selectedPlaceId: number | null;
  onSelectPlace: (id: number) => void;
}

type Point = {
  x: number;
  y: number;
};

const MAP_VIEWBOX = {
  x: 0,
  y: 0,
  width: 7016,
  height: 4961,
};

const DEFAULT_SCALE = 1.55;
const DEFAULT_OFFSET = { x: 0, y: 0 };

export function CampingMap({ places, bookings, selectedPlaceId, onSelectPlace }: CampingMapProps) {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState(DEFAULT_OFFSET);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const zoomStep = 0.12;
    const nextScale = e.deltaY < 0 ? scale + zoomStep : scale - zoomStep;
    const clampedScale = Math.min(Math.max(nextScale, 0.4), 6);
    setScale(clampedScale);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (editMode) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging) return;

    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function resetView() {
    setScale(DEFAULT_SCALE);
    setOffset(DEFAULT_OFFSET);
  }

  function clearPolygon() {
    setPolygonPoints([]);
  }

  function toggleEditMode() {
    setEditMode((prev) => !prev);
    setPolygonPoints([]);
  }

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!editMode) return;
    if (polygonPoints.length >= 4) return;

    const svg = e.currentTarget;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;

    const transformedPoint = point.matrixTransform(
      svg.getScreenCTM()?.inverse()
    );

    setPolygonPoints((prev) => [
      ...prev,
      {
        x: Math.round(transformedPoint.x),
        y: Math.round(transformedPoint.y),
      },
    ]);
  }

  const polygonString = useMemo(() => {
    return polygonPoints.map((p) => `${p.x},${p.y}`).join(" ");
  }, [polygonPoints]);
  function getCenter(points: string) {

  const coords = points.split(" ").map((p) => {
    const [x, y] = p.split(",").map(Number);
    return { x, y };
  });

  const avgX = coords.reduce((sum, p) => sum + p.x, 0) / coords.length;
  const avgY = coords.reduce((sum, p) => sum + p.y, 0) / coords.length;

  return { x: avgX, y: avgY };
}
function getPlaceFillColor(placeId: number, capacity: number) {
  const today = new Date().toISOString().split("T")[0];

  const currentOccupancy = bookings.filter(
    (booking) =>
      booking.place_id === placeId &&
      today >= booking.start_date &&
      today < booking.end_date
  ).length;

  if (currentOccupancy === 0) {
    return "rgba(34,197,94,0.25)"; // grün
  }

  if (currentOccupancy < capacity) {
    return "rgba(234,179,8,0.30)"; // gelb
  }

  return "rgba(220,38,38,0.45)"; // rot
}

function getPlaceStrokeColor(placeId: number, capacity: number) {
  const today = new Date().toISOString().split("T")[0];

  const currentOccupancy = bookings.filter(
    (booking) =>
      booking.place_id === placeId &&
      today >= booking.start_date &&
      today < booking.end_date
  ).length;

  if (currentOccupancy === 0) {
    return "#16a34a"; // grün
  }

  if (currentOccupancy < capacity) {
    return "#eab308"; // gelb
  }

  return "#dc2626"; // rot
}

function getCurrentOccupancy(placeId: number) {
  const today = new Date().toISOString().split("T")[0];

  return bookings.filter(
    (booking) =>
      booking.place_id === placeId &&
      today >= booking.start_date &&
      today < booking.end_date
  ).length;
}
  const mapPlaces = [
  { id: 1, label: "1", points: "908,2668 984,2672 984,2801 914,2811" },
  { id: 2, label: "2", points: "1010,2654 1071,2653 1068,2781 1003,2791" },
  { id: 3, label: "3", points: "1090,2635 1156,2627 1154,2762 1092,2769" },
  { id: 4, label: "4", points: "1185,2606 1249,2599 1253,2746 1187,2758" },
      {id: 5, label: "5", points: "1595,2595 1756,2559 1771,2662 1601,2700" },
  { id: 6, label: "6", points: "1809,2557 1978,2527 1990,2612 1818,2647" },
  { id: 7, label: "7", points: "2028,2519 2052,2609 2204,2580 2189,2495" },
  { id: 8, label: "8", points: "2253,2483 2262,2574 2455,2539 2443,2448" },
  { id: 9, label: "9", points: "" },
  { id: 10, label: "10", points: "2630,2424 2643,2510 2801,2478 2787,2399" },
  { id: 11, label: "11", points: "2831,2385 2851,2468 3000,2422 2985,2352" },
  { id: 12, label: "12", points: "3036,2329 3056,2407 3210,2347 3200,2278" },
  { id: 13, label: "13", points: "3250,2261 3273,2339 3420,2294 3404,2213" },
  { id: 14, label: "14", points: "3455,2203 3468,2281 3601,2256 3594,2182" },
  { id: 15, label: "15", points: "3617,2185 3622,2258 3745,2256 3743,2172" },
  { id: 16, label: "16", points: "3778,2177 3778,2243 3927,2273 3930,2195" },
  { id: 17, label: "17", points: "" },
  { id: 18, label: "18", points: "4825,2251 4825,2334 4998,2343 4988,2254" },
  { id: 19, label: "19", points: "5260,2244 5277,2341 5447,2287 5407,2209" },
  { id: 20, label: "20", points: "5941,1939 5938,2063 6023,2069 6044,1945" },
  { id: 21, label: "21", points: "6102,1966 6093,2073 6184,2076 6197,1969" },
  { id: 22, label: "22", points: "5977,2103 5983,2222 6075,2222 6072,2109" },
  { id: 23, label: "23", points: "6130,2106 6111,2222 6193,2231 6212,2115" },
  { id: 24, label: "24", points: "6294,2112 6291,2231 6391,2237 6388,2133" },
  { id: 25, label: "25", points: "6224,2578 6215,2666 6385,2678 6394,2590" },
  { id: 26, label: "26", points: "5664,2809 5670,2955 5752,2934 5734,2800" },
  { id: 27, label: "27", points: "5487,2840 5508,2983 5591,2965 5551,2831" },
  { id: 28, label: "28", points: "5329,3163 5320,3312 5414,3309 5411,3156" },
  { id: 29, label: "29", points: "5478,3153 5496,3293 5588,3278 5563,3153" },
  { id: 30, label: "30", points: "5633,3120 5655,3263 5749,3236 5722,3105" },
  { id: 31, label: "31", points: "5798,3077 5871,3059 5898,3202 5825,3205" },
  { id: 32, label: "32", points: "5947,3038 5962,3181 6050,3169 6026,3029" },
  { id: 33, label: "33", points: "6090,3013 6120,3144 6193,3132 6166,2998" },
  { id: 34, label: "34", points: "6260,3132 6455,3089 6486,3175 6291,3223" },
  { id: 35, label: "35", points: "6346,3257 6522,3211 6544,3303 6358,3354" },
  { id: 36, label: "36", points: "6410,3376 6425,3461 6589,3430 6565,3336" },
  { id: 37, label: "37", points: "6099,3421 6175,3400 6212,3540 6136,3561" },
  { id: 38, label: "38", points: "5956,3421 6032,3409 6069,3549 5996,3561" },
  { id: 39, label: "39", points: "5804,3421 5880,3409 5919,3543 5840,3558" },
  { id: 40, label: "40", points: "5664,3421 5743,3403 5779,3549 5706,3571" },
  { id: 41, label: "41", points: "196,3226 377,3239 372,3326 196,3310" },
  { id: 42, label: "42", points: "421,3237 586,3261 578,3353 410,3332" },
  { id: 43, label: "43", points: "646,3261 640,3351 811,3375 827,3272" },
  { id: 44, label: "44", points: "624,3031 621,3101 806,3107 808,3020" },
  { id: 45, label: "45", points: "" },
];

useEffect(() => {
  if (selectedPlaceId === null) return;
  if (editMode) return;
  if (!containerRef.current) return;

  const selectedMapPlace = mapPlaces.find(
    (place) => place.id === selectedPlaceId && place.points.trim() !== ""
  );

  if (!selectedMapPlace) return;

  const center = getCenter(selectedMapPlace.points);

  const containerWidth = containerRef.current.clientWidth;
  const containerHeight = containerRef.current.clientHeight;

  const fitScale = Math.min(
    containerWidth / MAP_VIEWBOX.width,
    containerHeight / MAP_VIEWBOX.height
  );

  const renderedMapWidth = MAP_VIEWBOX.width * fitScale;
  const renderedMapHeight = MAP_VIEWBOX.height * fitScale;

  const leftPadding = (containerWidth - renderedMapWidth) / 2;
  const topPadding = (containerHeight - renderedMapHeight) / 2;

  const pointX = leftPadding + center.x * fitScale;
  const pointY = topPadding + center.y * fitScale;

  const targetScale = 3.8;

  const containerCenterX = containerWidth / 2;
  const containerCenterY = containerHeight / 2;

  setScale(targetScale);
  setOffset({
    x: targetScale * (containerCenterX - pointX),
    y: targetScale * (containerCenterY - pointY),
  });
}, [selectedPlaceId, editMode]);

return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => setScale((prev) => Math.min(prev + 0.2, 6))} style={toolbarButtonStyle}>
          +
        </button>

        <button onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.4))} style={toolbarButtonStyle}>
          –
        </button>

        <button onClick={resetView} style={toolbarButtonStyle}>
          Reset
        </button>

        <button
          onClick={toggleEditMode}
          style={{
            ...toolbarButtonStyle,
            backgroundColor: editMode ? "#2563eb" : "white",
            color: editMode ? "white" : "#111827",
            border: "1px solid #2563eb",
          }}
        >
          {editMode ? "Bearbeitungsmodus aktiv" : "Bearbeitungsmodus starten"}
        </button>

        <button onClick={clearPolygon} style={toolbarButtonStyle}>
          Punkte löschen
        </button>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: "relative",
          width: "100%",
          height: "560px",
          border: "1px solid #d1d5db",
          borderRadius: "0.75rem",
          overflow: "hidden",
          backgroundColor: "#f8fafc",
          cursor: editMode ? "crosshair" : isDragging ? "grabbing" : "grab",
        }}
      >
        <svg
          viewBox={`${MAP_VIEWBOX.x} ${MAP_VIEWBOX.y} ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          onClick={handleSvgClick}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.08s ease-out",
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Karte selbst */}
          <image
            href="/camping-map.svg"
            x={MAP_VIEWBOX.x}
            y={MAP_VIEWBOX.y}
            width={MAP_VIEWBOX.width}
            height={MAP_VIEWBOX.height}
            preserveAspectRatio="xMidYMid meet"
          />

{!editMode &&
  mapPlaces
    .filter((place) => place.points.trim() !== "")
    .map((place) => {
      const center = getCenter(place.points);
      const placeData = places.find((p) => p.id === place.id);
      const fillColor = getPlaceFillColor(place.id, placeData?.capacity ?? 1);
      const currentOccupancy = getCurrentOccupancy(place.id);
      const isSelected = selectedPlaceId === place.id;
      const strokeColor = isSelected
        ? "#2563eb"
        : getPlaceStrokeColor(place.id, placeData?.capacity ?? 1);
      const strokeWidth = isSelected ? 18 : 12;

      return (
        <g key={place.id}>
          <polygon
            points={place.points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlace(place.id);
            }}
            onMouseEnter={() => setHoveredPlaceId(place.id)}
            onMouseLeave={() => setHoveredPlaceId(null)}
            style={{ cursor: "pointer" }}
          />

          <text
            x={center.x}
            y={center.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="80"
            fill="#111827"
            style={{
              pointerEvents: "none",
              userSelect: "none",
              fontWeight: 600,
            }}
          >
            {placeData?.name || place.id}
          </text>

          {hoveredPlaceId === place.id && placeData && (
            <g>
              <rect
                x={center.x - 150}
                y={center.y - 170}
                width="300"
                height="95"
                rx="14"
                fill="white"
                stroke="#d1d5db"
                strokeWidth="3"
              />
              <text
                x={center.x}
                y={center.y - 130}
                textAnchor="middle"
                fontSize="42"
                fill="#111827"
                style={{
                  pointerEvents: "none",
                  fontWeight: 700,
                }}
              >
                Platz {placeData.name}
              </text>
              <text
                x={center.x}
                y={center.y - 90}
                textAnchor="middle"
                fontSize="34"
                fill="#374151"
                style={{ pointerEvents: "none" }}
              >
                Belegung: {currentOccupancy} / {placeData.capacity}
              </text>
            </g>
          )}
        </g>
      );
    })}

          {/* Punkte / Polygon aus dem Bearbeitungstool */}
          {polygonPoints.length > 0 && (
            <>
              {polygonPoints.map((point, index) => (
                <circle
                  key={`${point.x}-${point.y}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="18"
                  fill="#2563eb"
                  stroke="white"
                  strokeWidth="6"
                />
              ))}

              {polygonPoints.length >= 2 && (
                <polyline
                  points={polygonString}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="18"
                  strokeDasharray="40 25"
                />
              )}

              {polygonPoints.length === 4 && (
                <polygon
                  points={polygonString}
                  fill="rgba(37, 99, 235, 0.20)"
                  stroke="#2563eb"
                  strokeWidth="18"
                />
              )}
            </>
          )}
        </svg>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #d1d5db",
          borderRadius: "0.75rem",
          backgroundColor: "white",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Polygon-Werkzeug</h3>

        <p style={{ marginTop: 0, color: "#4b5563" }}>
          Bearbeitungsmodus aktivieren und 4 Ecken auf der Karte anklicken.
        </p>

        <p style={{ marginBottom: "0.5rem" }}>
          <strong>Punkte:</strong> {polygonPoints.length} / 4
        </p>

        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontFamily: "monospace",
            fontSize: "0.95rem",
            wordBreak: "break-word",
          }}
        >
          {polygonString || "Noch keine Punkte gesetzt."}
        </div>

        {polygonPoints.length === 4 && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              backgroundColor: "#ecfeff",
              border: "1px solid #a5f3fc",
              borderRadius: "0.5rem",
            }}
          >
            <strong>Fertiges Polygon:</strong>
            <pre
              style={{
                marginTop: "0.5rem",
                marginBottom: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
              }}
            >
{`<polygon
  points="${polygonString}"
  fill="rgba(34,197,94,0.25)"
  stroke="#16a34a"
  onClick={() => onSelectPlace(PLATZ_ID)}
/>`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const toolbarButtonStyle: React.CSSProperties = {
  padding: "0.45rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
  backgroundColor: "white",
  cursor: "pointer",
};