import { useMemo, useState } from "react";
import { useViewport } from "../hooks/useViewport";
import type { Place, PlaceStatus } from "../types";

interface PlaceListProps {
  places: Place[];
  placeStatuses: PlaceStatus[];
  selectedPlaceId: number | null;
  onSelect: (placeId: number) => void;
}

type PlaceFilter = "all" | "green" | "yellow" | "red" | "gray";

function getStatusColor(status?: PlaceStatus | null) {
  if (!status) return "#9ca3af";

  if (status.status === "gray") return "#6b7280";
  if (status.status === "green") return "#16a34a";
  if (status.status === "yellow") return "#eab308";

  return "#dc2626";
}

function getPlaceTypeLabel(type?: string | null) {
  if (!type) return "Stellplatz";
  return type;
}

function getStatusText(place: Place, status?: PlaceStatus | null) {
  if (!status) return "Unbekannt";

  if (place.type === "Zeltwiese") {
    if (status.status === "gray") return "Dauercamper";

    if (status.status === "red") {
      return ` ${status.max_occupancy}/${place.capacity} Zelte`;
    }

    if (status.status === "yellow") {
      return ` ${status.max_occupancy}/${place.capacity} Zelte`;
    }

    return ` ${status.max_occupancy}/${place.capacity} Zelte`;
  }

  if (status.status === "gray") return "Dauercamper";
  if (status.status === "green") return "Frei";
  if (status.status === "yellow") return "Teilbelegt";

  return "Voll belegt";
}

export function PlaceList({
  places,
  placeStatuses,
  selectedPlaceId,
  onSelect,
}: PlaceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<PlaceFilter>("all");
  const { isMobile } = useViewport();

  const filteredPlaces = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return places.filter((place) => {
      const status = placeStatuses.find((s) => s.id === place.id);

      const matchesSearch =
        normalizedSearch === "" ||
        place.name.toLowerCase().includes(normalizedSearch) ||
        getPlaceTypeLabel(place.type).toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "all" ||
        (status?.status ?? "") === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [places, placeStatuses, searchTerm, activeFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <div style={controlsWrapperStyle}>
        <div>
          <label style={searchLabelStyle}>Suche</label>
          <input
            type="text"
            placeholder="z. B. 12, 1a, Dauercamper ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div>
          <div style={searchLabelStyle}>Filter</div>
          <div
            style={{
              ...filterRowStyle,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <button
              onClick={() => setActiveFilter("all")}
              style={{
                ...filterButtonStyle,
                ...(activeFilter === "all" ? activeFilterButtonStyle : {}),
              }}
            >
              Alle
            </button>

            <button
              onClick={() => setActiveFilter("green")}
              style={{
                ...filterButtonStyle,
                ...(activeFilter === "green" ? activeFilterButtonStyle : {}),
              }}
            >
              Frei
            </button>

            <button
              onClick={() => setActiveFilter("yellow")}
              style={{
                ...filterButtonStyle,
                ...(activeFilter === "yellow" ? activeFilterButtonStyle : {}),
              }}
            >
              Teilbelegt
            </button>

            <button
              onClick={() => setActiveFilter("red")}
              style={{
                ...filterButtonStyle,
                ...(activeFilter === "red" ? activeFilterButtonStyle : {}),
              }}
            >
              Voll
            </button>

            <button
              onClick={() => setActiveFilter("gray")}
              style={{
                ...filterButtonStyle,
                ...(activeFilter === "gray" ? activeFilterButtonStyle : {}),
              }}
            >
              Dauercamper
            </button>
          </div>
        </div>
      </div>

      <div style={resultInfoStyle}>
        {filteredPlaces.length} von {places.length} Plätzen angezeigt
      </div>

      {filteredPlaces.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>🔎</div>
          <div style={emptyTitleStyle}>Keine passenden Plätze</div>
          <div style={emptyTextStyle}>
            Passe deine Suche oder den aktiven Filter an.
          </div>
        </div>
      ) : (
        <div style={listWrapperStyle}>
          {filteredPlaces.map((place) => {
            const isSelected = selectedPlaceId === place.id;
            const status = placeStatuses.find((s) => s.id === place.id);

            return (
                <button
                key={place.id}
                onClick={() => onSelect(place.id)}
                onMouseUp={(e) => e.currentTarget.blur()}
                style={{
                  ...placeButtonStyle,
                  ...(isSelected ? selectedPlaceButtonStyle : {}),
                }}
              >
                  <div
                    style={{
                      ...placeTopRowStyle,
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "flex-start",
                    }}
                  >
                  <div style={placeNameBlockStyle}>
                    <div
                      style={{
                        ...placeNumberStyle,
                        ...(isSelected ? selectedPlaceNumberStyle : {}),
                      }}
                    >
                      {place.name}
                    </div>

                    <div
                      style={{
                        ...placeTypeStyle,
                        ...(isSelected ? selectedPlaceTypeStyle : {}),
                      }}
                    >
                      {getPlaceTypeLabel(place.type)}
                    </div>
                  </div>

                    <div
                    style={{
                      ...capacityBadgeStyle,
                      ...(isSelected ? selectedCapacityBadgeStyle : {}),
                    }}
                  >
                    {place.capacity}
                  </div>
                </div>

                <div style={placeBottomRowStyle}>
                  <span
                    style={{
                      ...statusDotStyle,
                      backgroundColor: getStatusColor(status),
                    }}
                  />
                  <span
                    style={{
                      ...placeMetaStyle,
                      ...(isSelected ? selectedPlaceMetaStyle : {}),
                    }}
                  >
                    {getStatusText(place, status)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const controlsWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const searchLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "#64748b",
  marginBottom: "0.5rem",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  boxSizing: "border-box",
  outline: "none",
  fontSize: "0.9rem",
  transition: "all 0.2s ease",
};

const filterRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const filterButtonStyle: React.CSSProperties = {
  padding: "0.55rem 1rem",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  backgroundColor: "#ffffff",
  color: "#64748b",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 700,
  transition: "all 0.2s ease",
};

const activeFilterButtonStyle: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1.5px solid #a7f3d0",
  color: "#059669",
};

const resultInfoStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#64748b",
  fontWeight: 600,
};

const listWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.85rem",
};

const placeButtonStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "1rem",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  background: "#ffffff",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  outline: "none",
};

const selectedPlaceButtonStyle: React.CSSProperties = {
  border: "1.5px solid #10b981",
  background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
  backgroundColor: "#ecfdf5",
  boxShadow: "0 12px 28px rgba(16, 185, 129, 0.18)",
  transform: "translateY(-2px)",
};

const placeTopRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "0.75rem",
};

const placeNameBlockStyle: React.CSSProperties = {
  minWidth: 0,
  flex: 1,
};

const placeNumberStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.2,
  marginBottom: "0.3rem",
};

const selectedPlaceNumberStyle: React.CSSProperties = {
  color: "#059669",
};

const placeTypeStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#64748b",
  lineHeight: 1.4,
};

const selectedPlaceTypeStyle: React.CSSProperties = {
  color: "#475569",
};

const capacityBadgeStyle: React.CSSProperties = {
  minWidth: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: "0.9rem",
  color: "#64748b",
  flexShrink: 0,
};

const selectedCapacityBadgeStyle: React.CSSProperties = {
  backgroundColor: "#ecfdf5",
  border: "1.5px solid #a7f3d0",
  color: "#059669",
};

const placeBottomRowStyle: React.CSSProperties = {
  marginTop: "0.65rem",
  display: "flex",
  alignItems: "center",
  gap: "0.45rem",
};

const statusDotStyle: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  flexShrink: 0,
};

const placeMetaStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#64748b",
  fontWeight: 600,
};

const selectedPlaceMetaStyle: React.CSSProperties = {
  color: "#475569",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "2rem 1.5rem",
  borderRadius: "8px",
  border: "2px dashed #cbd5e1",
  backgroundColor: "#f8fafc",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  marginBottom: "0.8rem",
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: "0.5rem",
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#64748b",
  lineHeight: 1.5,
};
