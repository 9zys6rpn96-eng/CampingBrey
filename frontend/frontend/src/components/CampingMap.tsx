import { useEffect, useMemo, useRef, useState } from "react";
import type { Place, PlaceStatus, Booking } from "../types";

interface CampingMapProps {
  places: Place[];
  placeStatuses: PlaceStatus[];
  selectedPlaceId: number | null;
  onSelectPlace: (id: number) => void;
  isDeveloper: boolean;
  bookings: Booking[];
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

const DEFAULT_SCALE = 1.50;
const DEFAULT_OFFSET = { x: 0, y: 0 };

export function CampingMap({
  places,
  placeStatuses,
  selectedPlaceId,
  onSelectPlace,
  isDeveloper,
  bookings,
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
  function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

  function getPlaceFillColor(status: PlaceStatus | null, isHovered: boolean, isSelected: boolean) {
    if (isSelected) {
      return "rgba(37, 99, 235, 0.22)";
    }

    if (!status) {
      return isHovered ? "rgba(156,163,175,0.40)" : "rgba(156,163,175,0.25)";
    }

    if (status.status === "gray") {
      return isHovered ? "rgba(107,114,128,0.48)" : "rgba(107,114,128,0.35)";
    }

    if (status.status === "green") {
      return isHovered ? "rgba(34,197,94,0.40)" : "rgba(34,197,94,0.25)";
    }

    if (status.status === "yellow") {
      return isHovered ? "rgba(234,179,8,0.44)" : "rgba(234,179,8,0.30)";
    }

    return isHovered ? "rgba(220,38,38,0.58)" : "rgba(220,38,38,0.45)";
  }

  function getPlaceStrokeColor(status: PlaceStatus | null, isSelected: boolean, isHovered: boolean) {
    if (isSelected) {
      return "#2563eb";
    }

    if (!status) {
      return isHovered ? "#6b7280" : "#9ca3af";
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
    { id: 5, label: "5", points: "1595,2595 1756,2559 1771,2662 1601,2700" },
    { id: 6, label: "6", points: "1809,2557 1978,2527 1990,2612 1818,2647" },
    { id: 7, label: "7", points: "2028,2519 2052,2609 2204,2580 2189,2495" },
    { id: 8, label: "8", points: "2253,2483 2262,2574 2455,2539 2443,2448" },
    { id: 9, label: "9", points: "2493,2367 2486,2512 2581,2498 2558,2356" },
    { id: 10, label: "10", points: "2630,2424 2643,2510 2801,2478 2787,2399" },
    { id: 11, label: "11", points: "2831,2385 2851,2468 3000,2422 2985,2352" },
    { id: 12, label: "12", points: "3036,2329 3056,2407 3210,2347 3200,2278" },
    { id: 13, label: "13", points: "3250,2261 3273,2339 3420,2294 3404,2213" },
    { id: 14, label: "14", points: "3455,2203 3468,2281 3601,2256 3594,2182" },
    { id: 15, label: "15", points: "3617,2185 3622,2258 3745,2256 3743,2172" },
    { id: 16, label: "16", points: "3778,2177 3778,2243 3927,2273 3930,2195" },
    { id: 17, label: "17", points: "3977,2123 3952,2264 4044,2275 4044,2128" },
    { id: 18, label: "18", points: "4862,2166 4856,2307 4944,2304 4937,2170" },
    { id: 19, label: "19", points: "5283,2170 5293,2310 5378,2290 5349,2147" },
    { id: 20, label: "20", points: "5941,1939 5938,2063 6023,2069 6044,1945" },
    { id: 21, label: "21", points: "6102,1966 6093,2073 6184,2076 6197,1969" },
    { id: 22, label: "22", points: "5977,2103 5983,2222 6075,2222 6072,2109" },
    { id: 23, label: "23", points: "6130,2106 6111,2222 6193,2231 6212,2115" },
    { id: 24, label: "24", points: "6294,2112 6291,2231 6391,2237 6388,2133" },
    { id: 25, label: "25", points: "6279,2393 6285,2552 6366,2544 6363,2399" },
    { id: 26, label: "26", points: "6271,2625 6251,2772 6355,2772 6346,2625" },
    { id: 27, label: "27", points: "6054,2717 6048,2861 6148,2848 6115,2705" },
    { id: 28, label: "28", points: "5820,2781 5842,2920 5939,2892 5886,2753" },
    { id: 29, label: "29", points: "5594,2828 5599,2962 5697,2956 5661,2817" },
    { id: 30, label: "30", points: "5346,2864 5335,3006 5427,3009 5421,2859" },
    { id: 31, label: "31", points: "5555,3140 5577,3281 5666,3266 5630,3133" },
    { id: 32, label: "32", points: "5724,3105 5738,3252 5835,3223 5792,3083" },
    { id: 33, label: "33", points: "5889,3079 5918,3212 6004,3198 5968,3058" },
    { id: 34, label: "34", points: "6061,3033 6083,3180 6173,3158 6137,3008" },
    { id: 35, label: "35", points: "6331,3008 6349,3101 6482,3069 6460,2986" },
    { id: 36, label: "36", points: "6363,3158 6374,3252 6510,3219 6496,3151" },
    { id: 37, label: "37", points: "6390,3318 6406,3413 6537,3377 6527,3302" },
    { id: 38, label: "38", points: "6230,3482 6227,3566 6377,3570 6370,3478" },
    { id: 39, label: "39", points: "5978,3478 5969,3570 6125,3570 6129,3475" },
    { id: 40, label: "40", points: "5711,3475 5698,3563 5851,3570 5851,3478" },
    { id: 41, label: "41", points: "196,3226 377,3239 372,3326 196,3310" },
    { id: 42, label: "42", points: "421,3237 586,3261 578,3353 410,3332" },
    { id: 43, label: "43", points: "646,3261 640,3351 811,3375 827,3272" },
    { id: 44, label: "44", points: "624,3031 621,3101 806,3107 808,3020" },
    { id: 45, label: "45", points: "4131,2149 4108,2291 4198,2299 4200,2154" },
    { id: 46, label: "46", points: "4295,2157 4290,2302 4387,2294 4373,2152" },
    { id: 47, label: "47", points: "4473,2162 4454,2312 4555,2309 4543,2162" },
    { id: 48, label: "48", points: "4654,2153 4636,2293 4725,2297 4722,2156" },
    { id: 49, label: "49", points: "5078,2186 5065,2320 5136,2326 5136,2186" },
    { id: 50, label: "50", points: "5407,2121 5495,2222 5561,2157 5450,2062" },
    { id: 51, label: "51", points: "5522,1967 5636,2055 5668,1974 5557,1909" },
    { id: 52, label: "52", points: "5636,1785 5740,1876 5799,1801 5675,1732" },
    { id: 53, label: "53", points: "5892,1654 5897,1801 5990,1786 5966,1639" },
    { id: 54, label: "54", points: "6113,1666 6077,1801 6170,1816 6176,1672" },
    { id: 55, label: "55", points: "6277,1690 6232,1825 6325,1846 6349,1702" },
    { id: 56, label: "56", points: "6045,2375 6049,2528 6133,2530 6140,2380" },
    { id: 57, label: "57", points: "5777,2403 5782,2549 5851,2554 5868,2408" },
    { id: 58, label: "58", points: "5571,2423 5574,2561 5650,2559 5662,2418" },
    { id: 59, label: "59", points: "5277,2499 5289,2643 5378,2621 5342,2487" },
    { id: 60, label: "60", points: "4974,2499 4966,2643 5060,2633 5057,2497" },
    { id: 61, label: "61", points: "4711,2487 4715,2631 4794,2628 4806,2487" },
    { id: 62, label: "62", points: "4534,2497 4543,2650 4617,2640 4627,2504" },
    { id: 63, label: "63", points: "4364,2540 4371,2690 4440,2683 4455,2537" },
    { id: 64, label: "64", points: "4176,2565 4184,2712 4256,2712 4270,2560" },
    { id: 65, label: "65", points: "3919,2786 3842,2789 3825,2648 3922,2651" },
    { id: 66, label: "66", points: "3820,2416 3828,2565 3908,2554 3911,2416" },
    { id: 67, label: "67", points: "3585,2405 3594,2557 3668,2552 3682,2403" },
    { id: 68, label: "68", points: "3370,2469 3411,2607 3483,2590 3467,2449" },
    { id: 69, label: "69", points: "3188,2521 3221,2659 3295,2640 3284,2507" },
    { id: 70, label: "70", points: "3009,2564 3044,2713 3113,2689 3101,2552" },
    { id: 71, label: "71", points: "2790,2610 2823,2734 2904,2721 2872,2587" },
    { id: 72, label: "72", points: "2591,2656 2627,2796 2702,2780 2669,2640" },
    { id: 73, label: "73", points: "2408,2689 2444,2822 2509,2806 2496,2672" },
    { id: 74, label: "74", points: "2209,2738 2242,2891 2317,2865 2300,2728" },
    { id: 75, label: "75", points: "2242,3145 2265,3286 2353,3270 2314,3126" },
    { id: 76, label: "76", points: "2363,3103 2392,3247 2474,3212 2437,3083" },
    { id: 77, label: "77", points: "2499,3059 2536,3200 2620,3177 2578,3039" },
    { id: 78, label: "78", points: "2635,3012 2665,3155 2756,3123 2709,2987" },
    { id: 79, label: "79", points: "2815,2967 2833,3101 2932,3083 2885,2952" },
    { id: 80, label: "80", points: "3006,2908 3008,3054 3110,3036 3083,2893" },
    { id: 81, label: "81", points: "3191,2866 3174,3017 3273,3009 3266,2866" },
    { id: 82, label: "82", points: "3350,2863 3345,3002 3439,2999 3426,2851" },
    { id: 83, label: "83", points: "3518,2844 3518,2982 3614,2972 3590,2829" },
    { id: 84, label: "84", points: "5436,3474 5433,3571 5587,3571 5577,3482" },
    { id: 85, label: "85", points: "5259,3344 5265,3507 5351,3510 5348,3347" },
    { id: 86, label: "86", points: "5265,3152 5268,3292 5348,3304 5348,3149" },
    { id: 87, label: "87", points: "4428,2871 5079,2851 5037,3581 4544,3581" },
    { id: 88, label: "88", points: "4274,3438 4274,3533 4418,3529 4414,3458" },
    { id: 89, label: "89", points: "3975,3446 3975,3541 4127,3533 4115,3462" },
    { id: 90, label: "90", points: "3676,3458 3684,3557 3823,3522 3811,3446" },
    { id: 91, label: "91", points: "3428,3482 3420,3577 3568,3569 3564,3498" },
    { id: 92, label: "92", points: "3173,3442 3165,3537 3304,3549 3312,3474" },
    { id: 93, label: "93", points: "3256,3142 3245,3234 3384,3222 3384,3162" },
    { id: 94, label: "94", points: "3524,3142 3532,3230 3668,3198 3656,3134" },
    { id: 95, label: "95", points: "3716,3186 3716,3274 3863,3266 3855,3178" },
    { id: 96, label: "96", points: "3728,3314 3744,3402 3879,3378 3863,3302" },
    { id: 97, label: "97", points: "3959,3154 3959,3250 4099,3242 4099,3158" },
    { id: 98, label: "98", points: "3975,3298 3983,3386 4123,3358 4115,3274" },
    { id: 99, label: "99", points: "4199,3182 4215,3330 4298,3326 4274,3166" },
    { id: 100, label: "100", points: "2498,3402 2518,3565 2773,3518 2746,3378" },
    { id: 101, label: "101", points: "260,2805 241,2948 321,2948 336,2801" },
    { id: 102, label: "102", points: "491,2763 476,2907 563,2907 570,2759" },
    { id: 103, label: "103", points: "729,2729 721,2873 816,2862 801,2725" },
    { id: 104, label: "104", points: "" },

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

  const hoveredPlace = hoveredPlaceId
    ? places.find((p) => p.id === hoveredPlaceId) ?? null
    : null;

  const todayIso = new Date().toISOString().split("T")[0];

  const hoveredPlaceBookings = hoveredPlaceId
    ? bookings
        .filter(
          (booking) =>
            booking.place_id === hoveredPlaceId &&
            booking.end_date > todayIso
        )
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
    : [];

  return (
    <div>
      <div style={topToolbarStyle}>
        <div style={toolbarLeftStyle}>
          <button
            onClick={() => setScale((prev) => Math.min(prev + 0.2, 6))}
            style={toolbarButtonStyle}
          >
            ＋
          </button>

          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.4))}
            style={toolbarButtonStyle}
          >
            －
          </button>

          <button onClick={resetView} style={toolbarButtonStyle}>
            Reset
          </button>
        </div>

        <div style={toolbarRightStyle}>
          <div style={zoomBadgeStyle}>Zoom: {scale.toFixed(2)}x</div>

          {isDeveloper && (
            <button
              onClick={toggleEditMode}
              style={{
                ...toolbarButtonStyle,
                ...(editMode ? activeToolbarButtonStyle : {}),
              }}
            >
              {editMode ? "Bearbeitungsmodus aktiv" : "Bearbeitungsmodus"}
            </button>
          )}

          {editMode && (
            <button onClick={clearPolygon} style={toolbarButtonStyle}>
              Punkte löschen
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          ...mapContainerStyle,
          cursor: editMode ? "crosshair" : isDragging ? "grabbing" : "grab",
        }}
      >
        <div style={mapBackgroundGlowStyle} />

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
            href="/camping-map-v2.svg"
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
              const isSelected = selectedPlaceId === place.id;
              const isHovered = hoveredPlaceId === place.id;

              const fillColor = getPlaceFillColor(placeStatus, isHovered, isSelected);
              const strokeColor = getPlaceStrokeColor(placeStatus, isSelected, isHovered);
              const strokeWidth = isSelected ? 18 : isHovered ? 15 : 12;

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
                    style={{
                      cursor: editMode ? "crosshair" : "pointer",
                      transition:
                        "fill 0.14s ease, stroke 0.14s ease, stroke-width 0.14s ease, opacity 0.14s ease",
                      filter: isSelected
                        ? "drop-shadow(0 0 10px rgba(37,99,235,0.35))"
                        : isHovered
                        ? "drop-shadow(0 0 8px rgba(0,0,0,0.12))"
                        : "none",
                    }}
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
                      fontWeight: isSelected ? 800 : 700,
                    }}
                  >
                    {placeData?.name || place.id}
                  </text>
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

{!editMode && hoveredPlace && (
  <div style={tooltipCardStyle}>
    <div style={tooltipTitleStyle}>Platz {hoveredPlace.name}</div>

    <div style={tooltipMetaRowStyle}>
      <span style={tooltipBadgeStyle}>
        {hoveredPlace.type || "Stellplatz"}
      </span>
      <span style={tooltipBadgeStyle}>
        Kapazität {hoveredPlace.capacity}
      </span>
    </div>

    {hoveredPlaceBookings.length === 0 ? (
      <div style={tooltipTextMutedStyle}>Keine Buchungen vorhanden.</div>
    ) : (
      <div style={tooltipBookingsStyle}>
        <div style={tooltipBookingsTitleStyle}>Buchungen</div>

        {hoveredPlaceBookings.slice(0, 4).map((booking) => (
          <div key={booking.id} style={tooltipBookingItemStyle}>
            <strong>{booking.guest_name}</strong>
            <span>
              {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
            </span>

            {booking.status === "noshow" && (
              <span style={tooltipNoShowStyle}>Nicht erschienen</span>
            )}
          </div>
        ))}

        {hoveredPlaceBookings.length > 4 && (
          <div style={tooltipMoreStyle}>
            + {hoveredPlaceBookings.length - 4} weitere Buchung(en)
          </div>
        )}
      </div>
    )}
  </div>
)}
</div>

<div style={legendStyle}>
  <div style={legendItemStyle}>
    <span
      style={{
        ...legendDotStyle,
        backgroundColor: "rgba(34,197,94,0.55)",
        borderColor: "#16a34a",
      }}
    />
    Frei
  </div>

  <div style={legendItemStyle}>
    <span
      style={{
        ...legendDotStyle,
        backgroundColor: "rgba(234,179,8,0.60)",
        borderColor: "#eab308",
      }}
    />
    Teilweise belegt
  </div>

  <div style={legendItemStyle}>
    <span
      style={{
        ...legendDotStyle,
        backgroundColor: "rgba(220,38,38,0.60)",
        borderColor: "#dc2626",
      }}
    />
    Voll belegt
  </div>

  <div style={legendItemStyle}>
    <span
      style={{
        ...legendDotStyle,
        backgroundColor: "rgba(107,114,128,0.50)",
        borderColor: "#6b7280",
      }}
    />
    Dauercamper
  </div>

  <div style={legendItemStyle}>
    <span
      style={{
        ...legendDotStyle,
        backgroundColor: "rgba(37,99,235,0.26)",
        borderColor: "#2563eb",
      }}
    />
    Ausgewählt
  </div>
</div>

{isDeveloper && (
  <div style={developerPanelStyle}>
    <div style={developerPanelHeaderStyle}>
      <div>
        <h3 style={developerPanelTitleStyle}>Polygon-Werkzeug</h3>
        <p style={developerPanelTextStyle}>
          Bearbeitungsmodus aktivieren und 4 Ecken auf der Karte anklicken.
        </p>
      </div>

      <div style={developerBadgeStyle}>
        {polygonPoints.length} / 4 Punkte
      </div>
    </div>

    <div style={developerCodeBoxStyle}>
      {polygonString || "Noch keine Punkte gesetzt."}
    </div>

    {polygonPoints.length === 4 && (
      <div style={developerResultBoxStyle}>
        <strong>Fertiges Polygon:</strong>
        <pre style={developerPreStyle}>
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

const topToolbarStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "0.9rem",
  padding: "0.85rem 0.95rem",
  borderRadius: "0.95rem",
  border: "1px solid #d7e4db",
  background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
};

const toolbarLeftStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.55rem",
  flexWrap: "wrap",
};

const toolbarRightStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.55rem",
  flexWrap: "wrap",
  alignItems: "center",
};

const toolbarButtonStyle: React.CSSProperties = {
  padding: "0.6rem 0.9rem",
  borderRadius: "0.75rem",
  border: "1px solid #bfd4c7",
  backgroundColor: "#ffffff",
  color: "#163126",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const activeToolbarButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  color: "white",
  border: "1px solid #15803d",
  boxShadow: "0 8px 18px rgba(21, 128, 61, 0.20)",
};

const zoomBadgeStyle: React.CSSProperties = {
  padding: "0.55rem 0.75rem",
  borderRadius: "999px",
  backgroundColor: "#ffffff",
  border: "1px solid #d7e4db",
  color: "#355447",
  fontWeight: 700,
  fontSize: "0.9rem",
};

const mapContainerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "580px",
  border: "1px solid #d7e4db",
  borderRadius: "1rem",
  overflow: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(220,252,231,0.9) 0%, rgba(248,250,252,1) 35%, rgba(240,249,255,0.95) 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 24px rgba(0,0,0,0.05)",
  overscrollBehavior: "contain",
  touchAction: "none",
};

const mapBackgroundGlowStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 20% 15%, rgba(34,197,94,0.10) 0%, transparent 35%), radial-gradient(circle at 85% 20%, rgba(59,130,246,0.10) 0%, transparent 30%)",
  pointerEvents: "none",
  zIndex: 0,
};

const tooltipCardStyle: React.CSSProperties = {
  position: "absolute",
  top: "1rem",
  left: "1rem",
  padding: "0.85rem 0.95rem",
  borderRadius: "0.9rem",
  backgroundColor: "rgba(255,255,255,0.95)",
  border: "1px solid #d7e4db",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(6px)",
  maxWidth: "240px",
  zIndex: 10,
};

const tooltipTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "0.95rem",
  color: "#163126",
  marginBottom: "0.4rem",
};

const tooltipMetaRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.4rem",
  flexWrap: "wrap",
  marginBottom: "0.4rem",
};

const tooltipBadgeStyle: React.CSSProperties = {
  padding: "0.2rem 0.5rem",
  borderRadius: "999px",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#166534",
};

const tooltipTextMutedStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#6b7280",
};

const legendStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  padding: "0.75rem 0.9rem",
  borderRadius: "0.9rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
};

const legendItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  fontSize: "0.85rem",
  color: "#355447",
  fontWeight: 600,
};

const legendDotStyle: React.CSSProperties = {
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  border: "2px solid",
};

const developerPanelStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  borderRadius: "1rem",
  border: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const developerPanelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.75rem",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const developerPanelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 800,
  color: "#163126",
};

const developerPanelTextStyle: React.CSSProperties = {
  margin: "0.25rem 0 0 0",
  fontSize: "0.85rem",
  color: "#5f766b",
};

const developerBadgeStyle: React.CSSProperties = {
  padding: "0.4rem 0.65rem",
  borderRadius: "999px",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  fontWeight: 700,
  fontSize: "0.8rem",
  color: "#166534",
};

const developerCodeBoxStyle: React.CSSProperties = {
  padding: "0.65rem 0.75rem",
  borderRadius: "0.75rem",
  backgroundColor: "#f8fafc",
  border: "1px solid #e5e7eb",
  fontFamily: "monospace",
  fontSize: "0.8rem",
  color: "#111827",
  marginBottom: "0.75rem",
  wordBreak: "break-all",
};

const developerResultBoxStyle: React.CSSProperties = {
  padding: "0.75rem",
  borderRadius: "0.75rem",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
};

const developerPreStyle: React.CSSProperties = {
  margin: 0,
  marginTop: "0.4rem",
  fontSize: "0.75rem",
  fontFamily: "monospace",
  whiteSpace: "pre-wrap",
  color: "#163126",
};

const tooltipBookingsStyle: React.CSSProperties = {
  marginTop: "0.75rem",
  paddingTop: "0.65rem",
  borderTop: "1px solid #e5e7eb",
};

const tooltipBookingsTitleStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 800,
  color: "#374151",
  marginBottom: "0.45rem",
};

const tooltipBookingItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.15rem",
  padding: "0.45rem 0",
  fontSize: "0.82rem",
  color: "#374151",
};

const tooltipNoShowStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  marginTop: "0.2rem",
  padding: "0.18rem 0.45rem",
  borderRadius: "999px",
  backgroundColor: "#fef3c7",
  color: "#92400e",
  fontSize: "0.75rem",
  fontWeight: 700,
};

const tooltipMoreStyle: React.CSSProperties = {
  marginTop: "0.35rem",
  fontSize: "0.8rem",
  color: "#6b7280",
  fontWeight: 700,
};