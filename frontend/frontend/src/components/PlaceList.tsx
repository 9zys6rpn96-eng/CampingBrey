import { useMemo, useState } from "react";
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

function getStatusLabel(status?: PlaceStatus | null) {
  if (!status) return "Unbekannt";

  if (status.status === "gray") return "Dauercamper";
  if (status.status === "green") return "Frei";
  if (status.status === "yellow") return "Teilbelegt";

  return "Voll belegt";
}

function getPlaceTypeLabel(type?: string | null) {
  if (!type) return "Stellplatz";
  return type;
}

export function PlaceList({
  places,
  placeStatuses,
  selectedPlaceId,
  onSelect,
}: PlaceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<PlaceFilter>("all");

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
          <div style={filterRowStyle}>
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
                <div style={placeTopRowStyle}>
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
                    {getStatusLabel(status)}
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
  gap: "0.75rem",
};

const searchLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#5f766b",
  marginBottom: "0.35rem",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.82rem",
  border: "1px solid #bfd4c7",
  borderRadius: "0.75rem",
  backgroundColor: "#ffffff",
  color: "#163126",
  boxSizing: "border-box",
  outline: "none",
};

const filterRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.45rem",
  flexWrap: "wrap",
};

const filterButtonStyle: React.CSSProperties = {
  padding: "0.45rem 0.7rem",
  borderRadius: "999px",
  border: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
  color: "#355447",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 700,
};

const activeFilterButtonStyle: React.CSSProperties = {
  backgroundColor: "#dcfce7",
  border: "1px solid #86efac",
  color: "#166534",
};

const resultInfoStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  color: "#6b7280",
  fontWeight: 600,
};

const listWrapperStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.7rem",
};

const placeButtonStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "0.9rem 0.95rem",
  borderRadius: "0.95rem",
  border: "1px solid #d7e4db",
  background: "#ffffff",
  backgroundColor: "#ffffff",
  color: "#163126",
  cursor: "pointer",
  transition:
    "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background-color 0.12s ease",
  boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  outline: "none",
};

const selectedPlaceButtonStyle: React.CSSProperties = {
  border: "1px solid #15803d",
  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
  backgroundColor: "#dcfce7",
  boxShadow: "0 10px 22px rgba(21, 128, 61, 0.14)",
  transform: "translateY(-1px)",
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
  fontSize: "1.02rem",
  fontWeight: 800,
  color: "#163126",
  lineHeight: 1.2,
  marginBottom: "0.2rem",
};

const selectedPlaceNumberStyle: React.CSSProperties = {
  color: "#166534",
};

const placeTypeStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#5f766b",
  lineHeight: 1.35,
};

const selectedPlaceTypeStyle: React.CSSProperties = {
  color: "#355447",
};

const capacityBadgeStyle: React.CSSProperties = {
  minWidth: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "1px solid #d7e4db",
  backgroundColor: "#f8fafc",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: "0.9rem",
  color: "#355447",
  flexShrink: 0,
};

const selectedCapacityBadgeStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #86efac",
  color: "#166534",
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
  fontSize: "0.82rem",
  color: "#6b7280",
  fontWeight: 600,
};

const selectedPlaceMetaStyle: React.CSSProperties = {
  color: "#355447",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "1.25rem 1rem",
  borderRadius: "1rem",
  border: "1px dashed #cbd5e1",
  backgroundColor: "#f8fafc",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "0.55rem",
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 800,
  color: "#163126",
  marginBottom: "0.3rem",
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#5f766b",
  lineHeight: 1.45,
};
