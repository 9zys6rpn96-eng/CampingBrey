import { useEffect, useMemo, useRef, useState } from "react";
import type { Place, PlaceStatus } from "../types";

interface CampingMapProps {
  places: Place[];
  placeStatuses: PlaceStatus[];
  selectedPlaceId: number | null;
  onSelectPlace: (id: number) => void;
  isDeveloper: boolean;
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

export function CampingMap({
  places,
  placeStatuses,
  selectedPlaceId,
  onSelectPlace,
  isDeveloper,
}: CampingMapProps) {
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
  e.stopPropagation();

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
function getStatusForPlace(placeId: number, placeStatuses: PlaceStatus[]) {
  return placeStatuses.find((status) => status.id === placeId) ?? null;
}

function getPlaceFillColor(status: PlaceStatus | null) {
  if (!status) {
    return "rgba(156,163,175,0.25)";
  }

  if (status.status === "gray") {
    return "rgba(107,114,128,0.35)";
  }

  if (status.status === "green") {
    return "rgba(34,197,94,0.25)";
  }

  if (status.status === "yellow") {
    return "rgba(234,179,8,0.30)";
  }

  return "rgba(220,38,38,0.45)";
}

function getPlaceStrokeColor(status: PlaceStatus | null) {
  if (!status) {
    return "#9ca3af";
  }

  if (status.status === "gray") {
    return "#6b7280";
  }

  if (status.status === "green") {
    return "#16a34a";
  }

  if (status.status === "yellow") {
    return "#eab308";
  }

  return "#dc2626";
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
  { id: 9, label: "9", points: "2436,2370 2586,2351 2617,2513 2467,2536" },
  { id: 10, label: "10", points: "2630,2424 2643,2510 2801,2478 2787,2399" },
  { id: 11, label: "11", points: "2831,2385 2851,2468 3000,2422 2985,2352" },
  { id: 12, label: "12", points: "3036,2329 3056,2407 3210,2347 3200,2278" },
  { id: 13, label: "13", points: "3250,2261 3273,2339 3420,2294 3404,2213" },
  { id: 14, label: "14", points: "3455,2203 3468,2281 3601,2256 3594,2182" },
  { id: 15, label: "15", points: "3617,2185 3622,2258 3745,2256 3743,2172" },
  { id: 16, label: "16", points: "3778,2177 3778,2243 3927,2273 3930,2195" },
  { id: 17, label: "17", points: "3940,2099 3933,2284 4061,2326 4078,2111" },
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
  { id: 45, label: "45", points: "4085,2111 4073,2319 4246,2333 4246,2116" },
  { id: 46, label: "46", points: "4249,2120 4253,2338 4419,2343 4424,2102" },
  { id: 47, label: "47", points: "4427,2108 4425,2333 4587,2335 4584,2115" },
  { id: 48, label: "48", points: "4589,2125 4778,2136 4778,2340 4589,2342" },
  { id: 49, label: "49", points: "5013,2347 5251,2352 5208,2141 5019,2191" },
  { id: 50, label: "50", points: "5376,2111 5458,2291 5645,2128 5430,1992" },
  { id: 51, label: "51", points: "5519,1807 5428,1985 5647,2123 5739,1938" },
  { id: 52, label: "52", points: "5743,1924 5846,1852 5764,1599 5526,1802" },
  { id: 53, label: "53", points: "5849,1849 6040,1849 6062,1590 5788,1613" },
  { id: 54, label: "54", points: "6050,1842 6204,1870 6239,1618 6064,1592" },
  { id: 55, label: "55", points: "6237,1615 6405,1643 6352,1896 6209,1873" },
  { id: 56, label: "56", points: "6009,2344 5991,2631 6204,2618 6231,2346" },
  { id: 57, label: "57", points: "5715,2324 6005,2336 5991,2633 5729,2607" },
  { id: 58, label: "58", points: "5463,2394 5523,2638 5722,2600 5718,2320" },
  { id: 59, label: "59", points: "5528,2639 5468,2409 4866,2437 4871,2659" },
  { id: 60, label: "60", points: "4485,2425 4490,2725 4869,2701 4867,2433" },
  { id: 61, label: "61", points: "4326,2422 4485,2420 4489,2734 4337,2811" },
  { id: 62, label: "62", points: "4330,2425 4333,2813 4082,2827 4085,2439" },
  { id: 63, label: "63", points: "3739,2346 3942,2380 3978,2643 3759,2653" },
  { id: 64, label: "64", points: "3524,2356 3553,2609 3746,2642 3733,2343" },
  { id: 65, label: "65", points: "3174,2720 3551,2607 3521,2357 3116,2486" },
  { id: 66, label: "66", points: "2943,2531 2984,2713 3171,2717 3119,2489" },
  { id: 67, label: "67", points: "2730,2587 2781,2778 2985,2721 2948,2534" },
  { id: 68, label: "68", points: "2346,2651 2397,2908 2763,2793 2723,2581" },
  { id: 69, label: "69", points: "2129,2692 2346,2654 2395,2907 2194,3019" },
  { id: 70, label: "70", points: "3469,2781 3624,2751 3675,3017 3498,3030" },
      { id: 71, label: "71", points: "3289,2780 3466,2780 3496,3036 3310,3045" },
  { id: 72, label: "72", points: "3112,2804 3154,3064 3304,3045 3285,2776" },
  { id: 73, label: "73", points: "3156,3060 2993,3109 2934,2870 3114,2807" },
  { id: 74, label: "74", points: "2988,3113 2810,3186 2723,2907 2927,2865" },
  { id: 75, label: "75", points: "2801,3181 2637,3237 2550,2945 2719,2896" },
  { id: 76, label: "76", points: "2546,2950 2382,3041 2454,3291 2639,3240" },
  { id: 77, label: "77", points: "2380,3045 2213,3146 2260,3317 2457,3286" },
  { id: 78, label: "78", points: "3182,3140 3143,3588 5055,3602 5071,2837" },
  { id: 79, label: "79", points: "3045,3200 2810,3589 2027,3635 2273,3398" },
  { id: 80, label: "80", points: "174,2820 161,3019 404,2964 389,2773" },
  { id: 81, label: "81", points: "395,2777 402,2964 676,2922 676,2731" },
  { id: 82, label: "82", points: "676,2731 891,2677 901,2859 690,2918" },
  { id: 83, label: "83", points: "5769,2763 5821,2954 6187,2858 6176,2690" },
  { id: 84, label: "84", points: "" },
];

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const wheelListener = (event: WheelEvent) => {
    event.preventDefault();
  };

  container.addEventListener("wheel", wheelListener, { passive: false });

  return () => {
    container.removeEventListener("wheel", wheelListener);
  };
}, []);

useEffect(() => {
  if (editMode) return;

  if (selectedPlaceId === null) {
    resetView();
    return;
  }

  if (!containerRef.current) return;

  const selectedMapPlace = mapPlaces.find(
    (place) => place.id === selectedPlaceId && place.points.trim() !== ""
  );

  if (!selectedMapPlace) {
    resetView();
    return;
  }

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
            alignItems: "center",
          }}
      >
        <button
            onClick={() => setScale((prev) => Math.min(prev + 0.2, 6))}
            style={toolbarButtonStyle}
        >
          +
        </button>

        <button
            onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.4))}
            style={toolbarButtonStyle}
        >
          –
        </button>

        <button onClick={resetView} style={toolbarButtonStyle}>
          Reset
        </button>

        {isDeveloper && (
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
        )}

        {editMode && (
            <button onClick={clearPolygon} style={toolbarButtonStyle}>
              Punkte löschen
            </button>
        )}
      </div>

     {isDeveloper && (
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
            Bearbeitungsmodus aktivieren und 4 Ecken auf der Karte anklicken..
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
      )}

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
            overscrollBehavior: "contain",
            touchAction: "none",
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
          <image
              href="/camping-map.svg"
              x={MAP_VIEWBOX.x}
              y={MAP_VIEWBOX.y}
              width={MAP_VIEWBOX.width}
              height={MAP_VIEWBOX.height}
              preserveAspectRatio="xMidYMid meet"
          />

          {mapPlaces
              .filter((place) => place.points.trim() !== "")
              .map((place) => {
                const center = getCenter(place.points);
                const placeData = places.find((p) => p.id === place.id);
                const placeStatus = getStatusForPlace(place.id, placeStatuses);
                const fillColor = getPlaceFillColor(placeStatus);
                const isSelected = selectedPlaceId === place.id;
                const strokeColor = isSelected ? "#2563eb" : getPlaceStrokeColor(placeStatus);
                const strokeWidth = isSelected ? 18 : 12;

                return (
                    <g key={place.id}>
                      <polygon
                          points={place.points}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          onClick={(e) => {
                            if (editMode) return;
                            e.stopPropagation();
                            onSelectPlace(place.id);
                          }}
                          onMouseEnter={() => {
                            if (!editMode) setHoveredPlaceId(place.id);
                          }}
                          onMouseLeave={() => {
                            if (!editMode) setHoveredPlaceId(null);
                          }}
                          style={{cursor: editMode ? "crosshair" : "pointer"}}
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

                      {!editMode && hoveredPlaceId === place.id && placeData && (
                          <g>
                            <rect
                                x={center.x - 150}
                                y={center.y - 170}
                                width="300"
                                height="125"
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

                            {placeStatus?.status === "gray" ? (
                                <text
                                    x={center.x}
                                    y={center.y - 80}
                                    textAnchor="middle"
                                    fontSize="34"
                                    fill="#374151"
                                    style={{pointerEvents: "none", fontWeight: 600}}
                                >
                                  Dauercamper
                                </text>
                            ) : (
                                <>
                                  <text
                                      x={center.x}
                                      y={center.y - 90}
                                      textAnchor="middle"
                                      fontSize="34"
                                      fill="#374151"
                                      style={{pointerEvents: "none"}}
                                  >
                                    Max. Belegung: {placeStatus?.max_occupancy ?? 0} / {placeData.capacity}
                                  </text>

                                  <text
                                      x={center.x}
                                      y={center.y - 55}
                                      textAnchor="middle"
                                      fontSize="30"
                                      fill="#4b5563"
                                      style={{pointerEvents: "none"}}
                                  >
                                    Tage belegt: {placeStatus?.occupied_days ?? 0}
                                  </text>
                                </>
                            )}
                          </g>
                      )}
                    </g>
                );
              })}

          {editMode && polygonPoints.length > 0 && (
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

      {isDeveloper && (
          <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.75rem",
                backgroundColor: "white",
              }}
          >
            <h3 style={{marginTop: 0, marginBottom: "0.5rem"}}>Polygon-Werkzeug</h3>

            <p style={{marginTop: 0, color: "#4b5563"}}>
              Bearbeitungsmodus mit <strong>Shift + E</strong> aktivieren und 4 Ecken auf der Karte anklicken.
            </p>

            <p style={{marginBottom: "0.5rem"}}>
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
      )}
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