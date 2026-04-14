// src/components/PlaceList.tsx
import type { Place } from "../types";

interface PlaceListProps {
  places: Place[];
  selectedPlaceId: number | null;
  onSelect: (id: number) => void;
}

export function PlaceList({ places, selectedPlaceId, onSelect }: PlaceListProps) {
  if (places.length === 0) {
    return <p>Noch keine Plätze vorhanden.</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {places.map((p) => {
        const isSelected = p.id === selectedPlaceId;
        return (
          <li
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              padding: "0.5rem 0.75rem",
              marginBottom: "0.25rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              border: isSelected ? "2px solid #2563eb" : "1px solid #d1d5db",
              backgroundColor: isSelected ? "#bfdbfe" : "#ffffff",
              color: "#111827",
            }}
          >
            <strong>{p.name}</strong>{" "}
            {p.type && <span style={{ opacity: 0.7 }}>({p.type})</span>}
          </li>
        );
      })}
    </ul>
  );
}
