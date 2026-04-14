import { useEffect, useState } from "react";
import type { Place, Booking } from "./types";
import { fetchPlaces, fetchBookings } from "./services/api";
import { PlaceList } from "./components/PlaceList";
import { PlaceDetailPanel } from "./components/PlaceDetailPanel";

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [placesData, bookingsData] = await Promise.all([
          fetchPlaces(),
          fetchBookings(),
        ]);

        setPlaces(placesData);
        setBookings(bookingsData);

        if (placesData.length > 0) {
          setSelectedPlaceId(placesData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function reloadBookings() {
    const bookingsData = await fetchBookings();
    setBookings(bookingsData);
  }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;
  const bookingsForSelectedPlace = selectedPlaceId
    ? bookings.filter((b) => b.place_id === selectedPlaceId)
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e5e7eb",
        color: "#111827",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "1.5rem",
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            marginBottom: "1rem",
            padding: "1rem 1.25rem",
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: 700,
            }}
          >
            Campingplatz – Verwaltung
          </h1>
          <p
            style={{
              margin: "0.35rem 0 0 0",
              color: "#4b5563",
              fontSize: "0.95rem",
            }}
          >
            Plätze auswählen, Buchungen ansehen und später direkt über die Karte verwalten.
          </p>
        </header>

        {loading && <p>Lade Daten...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "320px minmax(0, 1fr)",
              gap: "1rem",
              alignItems: "start",
            }}
          >
            <aside
              style={{
                backgroundColor: "white",
                border: "1px solid #d1d5db",
                borderRadius: "0.75rem",
                padding: "1rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                minHeight: "700px",
                boxSizing: "border-box",
              }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  marginTop: 0,
                  marginBottom: "0.75rem",
                }}
              >
                Plätze
              </h2>

              <PlaceList
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelect={setSelectedPlaceId}
              />
            </aside>

            <main
              style={{
                display: "grid",
                gridTemplateRows: "min-content 1fr",
                gap: "1rem",
                minHeight: "700px",
              }}
            >
              <section
                style={{
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: "0.5rem",
                    fontSize: "1rem",
                  }}
                >
                  Arbeitsbereich
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#4b5563",
                    fontSize: "0.95rem",
                  }}
                >
                  Dieser Bereich ist für Platzdetails, Buchungen und später die interaktive Karte vorgesehen.
                </p>
              </section>

              <section
                style={{
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  minHeight: "0",
                  boxSizing: "border-box",
                }}
              >
                <PlaceDetailPanel
                  place={selectedPlace}
                  bookings={bookingsForSelectedPlace}
                  onBookingCreated={reloadBookings}
                />
              </section>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;