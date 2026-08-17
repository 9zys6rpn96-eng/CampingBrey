import { useEffect, useMemo, useState } from "react";
import type { Place, Booking, PlaceStatus, User } from "./types";
import {
  fetchPlaces,
  fetchBookings,
  fetchPlaceStatuses,
  login,
  fetchMe,
  createUser,
  fetchAvailablePlaces,
  fetchUsers,
  deleteUser,
} from "./services/api";
import { PlaceList } from "./components/PlaceList.tsx";
import { CampingMap } from "./components/CampingMap";
import { OccupancyMatrix } from "./components/OccupancyMatrix";
import { BookingOverview } from "./components/BookingOverview";
import { NewBooking } from "./components/NewBooking";
import { PlaceDetailPanel } from "./components/PlaceDetailPanel";
import { useViewport } from "./hooks/useViewport";

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

function sortPlacesByName(places: Place[]) {
  return [...places].sort((a, b) => {
    const regex = /^(\d+)([a-zA-Z]*)$/;

    const matchA = a.name.match(regex);
    const matchB = b.name.match(regex);

    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);

      if (numA !== numB) {
        return numA - numB;
      }

      const suffixA = matchA[2] || "";
      const suffixB = matchB[2] || "";

      return suffixA.localeCompare(suffixB);
    }

    return a.name.localeCompare(b.name);
  });
}

function AdminApp() {
  const { isMobile, isTablet } = useViewport();

  useEffect(() => {
    document.title = "Campingplatz Brey – Verwaltung";
  }, []);

  const [places, setPlaces] = useState<Place[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [placeStatuses, setPlaceStatuses] = useState<PlaceStatus[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchStartDate, setSearchStartDate] = useState(() => toIsoDate(new Date()));
  const [searchEndDate, setSearchEndDate] = useState(() => toIsoDate(addDays(new Date(), 1)));
  const [vehicleLengthM, setVehicleLengthM] = useState("");
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
  } | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("operator");

  const [userCreateSuccess, setUserCreateSuccess] = useState<string | null>(null);
  const [userCreateError, setUserCreateError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

   const [users, setUsers] = useState<User[]>([]);
   const [usersError, setUsersError] = useState<string | null>(null);
   const [bookingModalOpen, setBookingModalOpen] = useState(false);
   const [placeModalTab, setPlaceModalTab] = useState<
   "booking" | "details"
 >("booking");
   const [viewMode, setViewMode] = useState<"map" | "matrix">("map");

   useEffect(() => {
     async function loadCurrentUser() {
       const token = localStorage.getItem("auth_token");

       if (!token) {
         setAuthLoading(false);
         return;
       }

       try {
         const user = await fetchMe();
         setCurrentUser(user);
       } catch (err) {
         localStorage.removeItem("auth_token");
         setCurrentUser(null);
         // Optional: Show error message for expired token
         console.warn("Authentifizierung fehlgeschlagen:", err);
       } finally {
         setAuthLoading(false);
       }
     }

     loadCurrentUser();
   }, []);

   useEffect(() => {
     if (!currentUser) {
       setLoading(false);
       return;
     }

     async function initialLoad() {
       try {
         setLoading(true);
         setError(null);

         const [placesData, bookingsData, statusData] = await Promise.all([
           fetchPlaces(),
           fetchBookings(),
           fetchPlaceStatuses(todayIso, todayIso),
         ]);

         const sortedPlaces = sortPlacesByName(placesData);

         setPlaces(sortedPlaces);
         setBookings(bookingsData);
         setPlaceStatuses(statusData);

         setSelectedPlaceId((prev) => {
           if (prev === null) {
             return null;
           }

           const stillExists = sortedPlaces.some((place) => place.id === prev);
           return stillExists ? prev : null;
         });
       } catch (err) {
         console.error(err);
         setError("Fehler beim Laden der Daten");
       } finally {
         setLoading(false);
         setHasLoadedOnce(true);
       }
     }

     initialLoad();
   }, [currentUser, todayIso]);

 async function reloadData() {
   if (!currentUser) return;

   try {
     setError(null);

     const [placesData, bookingsData, statusData] = await Promise.all([
       fetchPlaces(),
       fetchBookings(),
       fetchPlaceStatuses(todayIso, todayIso),
     ]);

     const sortedPlaces = sortPlacesByName(placesData);

     setPlaces(sortedPlaces);
     setBookings(bookingsData);
     setPlaceStatuses(statusData);

     setSelectedPlaceId((prev) => {
       if (prev === null) {
         return null;
       }

       const stillExists = sortedPlaces.some((place) => place.id === prev);
       return stillExists ? prev : null;
     });
   } catch (err) {
     console.error(err);
     setError("Fehler beim Laden der Daten");
   }
 }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  const availablePlaceIds = availablePlaces.map((place) => place.id);
  const availabilityMode = availablePlaces.length > 0;

  const bookingsForSelectedPlace =
    selectedPlaceId !== null
      ? bookings.filter((b) => b.place_id === selectedPlaceId)
      : [];
   const statusCounts = useMemo(() => {
     return placeStatuses.reduce(
       (acc, status) => {
         if (status.status === "green") acc.green += 1;
         else if (status.status === "yellow") acc.yellow += 1;
         else if (status.status === "red") acc.red += 1;
         else if (status.status === "gray") acc.gray += 1;
         else if (status.status === "blocked") acc.blocked += 1;

         return acc;
       },
       { green: 0, yellow: 0, red: 0, gray: 0, blocked: 0 }
     );
   }, [placeStatuses]);

   async function handleAvailabilitySearch() {
     try {
       setAvailabilityError(null);

       const length =
         vehicleLengthM.trim() === "" ? undefined : Number(vehicleLengthM);

       const result = await fetchAvailablePlaces(
         searchStartDate,
         searchEndDate,
         length
       );

       setAvailablePlaces(result);
     } catch (err: any) {
       setAvailabilityError(err.message || "Fehler bei der Verfügbarkeitssuche");
     }
   }

   function clearAvailabilitySearch() {
     setAvailablePlaces([]);
     setAvailabilityError(null);
     setVehicleLengthM("");
   }

  async function handleLogin() {
    try {
      setLoginError(null);
      setActionSuccess(null);

      const result = await login(username, password);
      localStorage.setItem("auth_token", result.access_token);

      const user = await fetchMe();
      setCurrentUser(user);

      setUsername("");
      setPassword("");
      setActionSuccess(`Erfolgreich eingeloggt als ${user.username}.`);
    } catch (err: any) {
      setLoginError(err.message || "Login fehlgeschlagen");
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setPlaces([]);
    setBookings([]);
    setPlaceStatuses([]);
    setSelectedPlaceId(null);
    setError(null);
    setLoading(false);
    setHasLoadedOnce(false);
    setActionSuccess(null);
    setUserCreateSuccess(null);
    setUserCreateError(null);
  }

   async function loadUsers() {
     if (currentUser?.role !== "developer") return;

     try {
       setUsersError(null);
       const usersData = await fetchUsers();
       setUsers(usersData);
     } catch (err: any) {
       setUsersError(err.message || "Fehler beim Laden der Benutzer");
     }
   }

   useEffect(() => {
     if (currentUser?.role === "developer") {
       loadUsers();
     }
   }, [currentUser]);

   async function handleCreateUser() {
     try {
       setUserCreateSuccess(null);
       setUserCreateError(null);

       const createdUser = await createUser({
         username: newUsername,
         password: newPassword,
         role: newUserRole,
       });

       setUserCreateSuccess(`Benutzer "${createdUser.username}" wurde erstellt.`);
       setNewUsername("");
       setNewPassword("");
       setNewUserRole("operator");

       await loadUsers();

     } catch (err: any) {
       setUserCreateError(err.message || "Fehler beim Erstellen des Benutzers");
     }
   }

   async function handleDeleteUser(userId: number) {
     const confirmed = window.confirm(
       "Diesen Benutzer wirklich löschen?"
     );

     if (!confirmed) return;

     try {
       await deleteUser(userId);
       await loadUsers();
       setActionSuccess("Benutzer wurde gelöscht.");
     } catch (err: any) {
       setUsersError(err.message || "Fehler beim Löschen");
     }
   }
    function handleSelectPlace(placeId: number) {
      if (selectedPlaceId === placeId && bookingModalOpen) {
        setSelectedPlaceId(null);
        setBookingModalOpen(false);
        return;
      }

      setSelectedPlaceId(placeId);
      setPlaceModalTab("booking");
      setBookingModalOpen(true);
    }

    function handleSelectDateRangeFromMatrix(
      placeId: number,
      startDate: string,
      endDate?: string
    ) {
      setSelectedPlaceId(placeId);
      setSearchStartDate(startDate);
      if (endDate) {
        setSearchEndDate(endDate);
      } else {
        // Wenn kein Enddatum, setze es auf nächsten Tag
        const nextDay = addDays(new Date(startDate), 1);
        const year = nextDay.getFullYear();
        const month = String(nextDay.getMonth() + 1).padStart(2, "0");
        const day = String(nextDay.getDate()).padStart(2, "0");
        setSearchEndDate(`${year}-${month}-${day}`);
      }
      setPlaceModalTab("booking");
      setBookingModalOpen(true);
    }

  if (authLoading) {
    return (
      <div style={pageLoadingStyle}>
        <div style={loadingCardStyle}>Authentifizierung wird geprüft...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={loginPageStyle}>
        <div style={loginCardStyle}>
          <div style={loginHeaderStyle}>
            <img
              src="/logo.png"
              alt="Campingplatz Brey"
              style={loginLogoStyle}
            />
            <div>
              <h1 style={loginTitleStyle}>Camping Brey</h1>
              <p style={loginSubtitleStyle}>Verwaltungsbereich</p>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={sectionTitleSmallStyle}>Betreiber-Login</h2>
            <p style={sectionMutedTextStyle}>
              Bitte mit deinem Benutzerkonto anmelden.
            </p>
          </div>

          <div style={{ marginBottom: "0.9rem" }}>
            <label style={labelStyle}>Benutzername</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              style={inputStyle}
            />
          </div>

          <button onClick={handleLogin} style={primaryButtonStyle}>
            Anmelden
          </button>

          {loginError && <div style={errorBoxStyle}>{loginError}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={appShellStyle}>
      <div style={topBarStyle}>
        <div style={topBarInnerStyle}>
          <div style={brandBlockStyle}>
            <img
              src="/logo.png"
              alt="Campingplatz Brey"
              style={brandLogoStyle}
            />
            <div>
              <div style={brandTitleStyle}>Campingplatz Brey</div>
              <div style={brandSubtitleStyle}>Verwaltung · Platzbelegung · Buchungen</div>
            </div>
          </div>

          <div style={headerRightStyle}>
            <div style={userBadgeStyle}>
              <span style={{ fontWeight: 700 }}>{currentUser.username}</span>
              <span style={{ opacity: 0.7 }}>· {currentUser.role}</span>
            </div>

            <button onClick={handleLogout} style={secondaryButtonStyle}>
              Abmelden
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          ...pageContentStyle,
          padding: isMobile ? "1rem" : isTablet ? "1.25rem" : "2rem",
        }}
      >
        {actionSuccess && <div style={successBoxStyle}>{actionSuccess}</div>}

        <section style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>Freie Plätze suchen</h2>
              <p style={cardSubtitleStyle}>
                Zeitraum und optional Fahrzeuglänge angeben.
              </p>
            </div>
          </div>

          <div style={formRowStyle}>
            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Anreise</label>
              <input
                  type="date"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Abreise</label>
              <input
                  type="date"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyleNarrow}>
              <label style={labelStyle}>Fahrzeuglänge in m</label>
              <input
                  type="number"
                  min="1"
                  value={vehicleLengthM}
                  onChange={(e) => setVehicleLengthM(e.target.value)}
                  style={inputStyle}
              />
            </div>

            <div style={actionFieldStyle}>
              <button onClick={handleAvailabilitySearch} style={primaryButtonStyle}>
                Freie Plätze anzeigen
              </button>

              <button
                  onClick={clearAvailabilitySearch}
                  style={secondaryButtonStyle}
              >
                Suche zurücksetzen
              </button>
            </div>
          </div>

          {availabilityError && <div style={errorBoxStyle}>{availabilityError}</div>}

          {availablePlaces.length > 0 && (
              <div style={successBoxStyle}>
                {availablePlaces.length} passende freie Plätze gefunden. Nicht passende Plätze sind auf der Karte abgedunkelt.
              </div>
            )}
        </section>

        <section
          style={{
            ...statsOverviewGridStyle,
            gridTemplateColumns: isMobile
              ? "1fr"
              : isTablet
                ? "repeat(2, minmax(0, 1fr))"
                : statsOverviewGridStyle.gridTemplateColumns,
          }}
        >
          <div style={statsOverviewCardStyle}>
            <div style={statsOverviewLabelStyle}>🟢 Frei</div>
            <div style={statsOverviewValueStyle}>{statusCounts.green}</div>
          </div>

          <div style={statsOverviewCardStyle}>
            <div style={statsOverviewLabelStyle}>🟡 Teilbelegt</div>
            <div style={statsOverviewValueStyle}>{statusCounts.yellow}</div>
          </div>

          <div style={statsOverviewCardStyle}>
            <div style={statsOverviewLabelStyle}>🔴 Voll</div>
            <div style={statsOverviewValueStyle}>{statusCounts.red}</div>
          </div>

          <div style={statsOverviewCardStyle}>
            <div style={statsOverviewLabelStyle}>⚫ Dauercamper</div>
            <div style={statsOverviewValueStyle}>{statusCounts.gray}</div>
          </div>

          <div style={statsOverviewCardStyle}>
            <div style={statsOverviewLabelStyle}>🟣 Gesperrt</div>
            <div style={statsOverviewValueStyle}>{statusCounts.blocked}</div>
          </div>
        </section>

        {loading && !hasLoadedOnce && (
            <div style={loadingCardStyle}>Lade Daten...</div>
        )}

        {error && <div style={errorBoxStyle}>{error}</div>}

        {!error && hasLoadedOnce && (
            <div
              style={{
                ...dashboardGridStyle,
                gridTemplateColumns: isMobile || isTablet ? "1fr" : dashboardGridStyle.gridTemplateColumns,
              }}
            >
              <aside style={sidebarCardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <h2 style={cardTitleStyle}>Plätze</h2>
                    <p style={cardSubtitleStyle}>
                      {places.length} Plätze verfügbar
                    </p>
                  </div>
                </div>

                <div style={sidebarContentStyle}>
                  <PlaceList
                      places={places}
                      placeStatuses={placeStatuses}
                      selectedPlaceId={selectedPlaceId}
                      onSelect={handleSelectPlace}
                  />
                </div>
              </aside>

               <main style={mainColumnStyle}>
                 <section style={cardStyle}>
                   <div style={cardHeaderStyle}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                       <div>
                         <h2 style={cardTitleStyle}>
                           {viewMode === "map" ? "Campingplatzkarte" : "Belegungsmatrix"}
                         </h2>
                         <p style={cardSubtitleStyle}>
                           {viewMode === "map"
                             ? "Wähle einen Platz direkt über die Karte oder über die Liste links."
                             : "Zeitliche Übersicht der Platzauslastung und Buchungen."}
                         </p>
                       </div>
                       <div style={viewToggleStyle}>
                         <button
                           onClick={() => setViewMode("map")}
                           style={{
                             ...viewToggleButtonStyle,
                             ...(viewMode === "map" ? activeViewToggleButtonStyle : {}),
                           }}
                         >
                           🗺️ Karte
                         </button>
                         <button
                           onClick={() => setViewMode("matrix")}
                           style={{
                             ...viewToggleButtonStyle,
                             ...(viewMode === "matrix" ? activeViewToggleButtonStyle : {}),
                           }}
                         >
                           📊 Belegungsmatrix
                         </button>
                       </div>
                     </div>
                   </div>

                   {viewMode === "map" ? (
                     <CampingMap
                       places={places}
                       placeStatuses={placeStatuses}
                       bookings={bookings}
                       selectedPlaceId={selectedPlaceId}
                       onSelectPlace={handleSelectPlace}
                       isDeveloper={currentUser.role === "developer"}
                       availablePlaceIds={availablePlaceIds}
                       availabilityMode={availabilityMode}
                     />
                   ) : (
                     <OccupancyMatrix
                       places={places}
                       bookings={bookings}
                       placeStatuses={placeStatuses}
                       selectedPlaceId={selectedPlaceId}
                       onSelectPlace={handleSelectPlace}
                       onSelectDateRange={handleSelectDateRangeFromMatrix}
                       isDeveloper={currentUser.role === "developer"}
                       availablePlaceIds={availablePlaceIds}
                       availabilityMode={availabilityMode}
                     />
                   )}
                 </section>

                <BookingOverview
                  bookings={bookings}
                  places={places}
                  onBookingUpdated={reloadData}
                />
              </main>
            </div>
        )}

        {bookingModalOpen && selectedPlace && (
          <div
            style={bookingModalOverlayStyle}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setBookingModalOpen(false);
                setSelectedPlaceId(null);
              }
            }}
          >
            <div style={bookingModalCardStyle}>
              <div style={bookingModalHeaderStyle}>
                <div>
                  <h2 style={bookingModalTitleStyle}>
                    Neue Buchung – Platz {selectedPlace.name}
                  </h2>

                  <p style={cardSubtitleStyle}>
                    Gastdaten und Buchungszeitraum direkt erfassen.
                  </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                      setBookingModalOpen(false);
                      setSelectedPlaceId(null);
                    }}
                    style={bookingModalCloseStyle}
                    aria-label="Fenster schließen"
                >
                  ✕
                </button>
              </div>

              <div style={modalTabRowStyle}>
                <button
                    type="button"
                    onClick={() => setPlaceModalTab("booking")}
                    style={{
                      ...modalTabButtonStyle,
                      ...(placeModalTab === "booking"
                          ? activeModalTabButtonStyle
                          : {}),
                    }}
                >
                  ➕ Neue Buchung
                </button>

                <button
                    type="button"
                    onClick={() => setPlaceModalTab("details")}
                    style={{
                      ...modalTabButtonStyle,
                      ...(placeModalTab === "details"
                          ? activeModalTabButtonStyle
                          : {}),
                    }}
                >
                  📋 Platzdetails & Buchungen
                </button>
              </div>

              {placeModalTab === "booking" ? (
                <NewBooking
                  place={selectedPlace}
                  bookings={bookingsForSelectedPlace}
                  initialStartDate={searchStartDate}
                  initialEndDate={searchEndDate}
                  initialVehicleLengthM={vehicleLengthM}
                  onBookingCreated={reloadData}
                  onBookingFinished={() => {
                    setBookingModalOpen(false);
                    setSelectedPlaceId(null);
                  }}
                />
              ) : (
                <PlaceDetailPanel
                  place={selectedPlace}
                  bookings={bookingsForSelectedPlace}
                  onBookingCreated={reloadData}
                  canEditPlaces={
                    currentUser.role === "developer" ||
                    currentUser.role === "operator"
                  }
                  showBookingForm={false}
                  initialStartDate={searchStartDate}
                  initialEndDate={searchEndDate}
                  initialVehicleLengthM={vehicleLengthM}
                />
              )}
            </div>
          </div>
        )}

        {currentUser.role === "developer" && (
            <section style={{...cardStyle, marginTop: "1rem"}}>
              <div style={cardHeaderStyle}>
                <div>
                  <h2 style={cardTitleStyle}>Benutzer anlegen</h2>
                  <p style={cardSubtitleStyle}>
                    Neuen Operator, Developer oder User für die Anwendung anlegen.
                  </p>
                </div>
              </div>

              <div style={formRowStyle}>
                <div style={fieldBlockStyle}>
                  <label style={labelStyle}>Benutzername</label>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Passwort</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyleNarrow}>
              <label style={labelStyle}>Rolle</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                style={inputStyle}
              >
                <option value="operator">Operator</option>
                <option value="user">User</option>
                <option value="developer">Developer</option>
              </select>
            </div>

            <div style={actionFieldStyle}>
              <button
                onClick={handleCreateUser}
                disabled={!newUsername.trim() || !newPassword.trim()}
                style={{
                  ...primaryButtonStyle,
                  opacity: !newUsername.trim() || !newPassword.trim() ? 0.6 : 1,
                  cursor:
                    !newUsername.trim() || !newPassword.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Benutzer anlegen
              </button>
            </div>
          </div>

          {userCreateSuccess && <div style={successBoxStyle}>{userCreateSuccess}</div>}
          {userCreateError && <div style={errorBoxStyle}>{userCreateError}</div>}

          <div style={{ marginTop: "2rem" }}>
            <div style={cardHeaderStyle}>
              <div>
                <h2 style={cardTitleStyle}>Benutzerübersicht</h2>
                <p style={cardSubtitleStyle}>
                  Alle vorhandenen Benutzerkonten und Rollen.
                </p>
              </div>
            </div>

            {usersError && <div style={errorBoxStyle}>{usersError}</div>}

            <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.5rem" }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "0.75rem",
                    border: `1px solid ${colors.border}`,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <strong>{user.username}</strong>
                    <span style={userBadgeStyle}>{user.role}</span>

                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        padding: "0.45rem 0.7rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #fecaca",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
const colors = {
  // Neutrals
  pageBg: "#f0f4f8",
  pageBgAlt: "#ffffff",
  cardBg: "#ffffff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  muted: "#64748b",

  // Brand - Emerald/Green
  brand: "#10b981",
  brandDark: "#059669",
  brandLight: "#d1fae5",
  brandSoft: "#ecfdf5",
  brandSoftBorder: "#a7f3d0",

  // Accent - Sky Blue
  accentBlue: "#0ea5e9",
  accentBlueSoft: "#e0f2fe",
  accentBlueBorder: "#bae6fd",

  // Status Colors
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",

  // Soft backgrounds
  dangerSoft: "#fee2e2",
  dangerBorder: "#fecaca",
  dangerText: "#991b1b",
  warningSoft: "#fef3c7",
  warningBorder: "#fde68a",
  warningText: "#92400e",
};

const appShellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 50%, #f0f4f8 100%)",
  color: colors.text,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
};

const topBarStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  backdropFilter: "blur(12px)",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderBottom: `2px solid ${colors.border}`,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
};

const topBarInnerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto",
  padding: "1rem 2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2rem",
  flexWrap: "wrap",
  boxSizing: "border-box",
};

const brandBlockStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const brandLogoStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  objectFit: "contain",
  borderRadius: "12px",
  backgroundColor: colors.brandSoft,
  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
  padding: "4px",
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: "1.35rem",
  fontWeight: 800,
  color: colors.text,
  lineHeight: 1.1,
  letterSpacing: "-0.5px",
};

const brandSubtitleStyle: React.CSSProperties = {
  marginTop: "0.3rem",
  fontSize: "0.9rem",
  color: colors.muted,
  fontWeight: 500,
};

const headerRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1.2rem",
  flexWrap: "wrap",
};

const userBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.6rem",
  padding: "0.7rem 1.2rem",
  borderRadius: "8px",
  backgroundColor: colors.accentBlueSoft,
  border: `1.5px solid ${colors.accentBlueBorder}`,
  color: colors.accentBlue,
  fontWeight: 600,
  fontSize: "0.9rem",
};

const pageContentStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto",
  padding: "2rem",
  boxSizing: "border-box",
};


const dashboardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "340px minmax(0, 1fr)",
  gap: "1.5rem",
  alignItems: "start",
};

const sidebarCardStyle: React.CSSProperties = {
  backgroundColor: colors.cardBg,
  border: `1.5px solid ${colors.border}`,
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  minHeight: "700px",
  boxSizing: "border-box",
  transition: "box-shadow 0.3s ease",
};

const sidebarContentStyle: React.CSSProperties = {
  maxHeight: "720px",
  overflowY: "auto",
  paddingRight: "0.5rem",
};

const mainColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "min-content 1fr",
  gap: "1.5rem",
  minHeight: "700px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.cardBg,
  border: `1.5px solid ${colors.border}`,
  borderRadius: "12px",
  padding: "2rem",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  boxSizing: "border-box",
  transition: "all 0.3s ease",
};

const cardHeaderStyle: React.CSSProperties = {
  marginBottom: "1.5rem",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
  fontWeight: 800,
  color: colors.text,
  letterSpacing: "-0.5px",
};

const cardSubtitleStyle: React.CSSProperties = {
  margin: "0.5rem 0 0 0",
  color: colors.muted,
  fontSize: "0.95rem",
  fontWeight: 500,
  lineHeight: 1.5,
};
const formRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1.2rem",
  flexWrap: "wrap",
  alignItems: "end",
};

const fieldBlockStyle: React.CSSProperties = {
  minWidth: "220px",
  flex: "1 1 220px",
};

const fieldBlockStyleNarrow: React.CSSProperties = {
  minWidth: "180px",
  flex: "0 1 180px",
};

const actionFieldStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "end",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.9rem",
  marginBottom: "0.6rem",
  color: colors.muted,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  border: `1.5px solid ${colors.border}`,
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: colors.text,
  boxSizing: "border-box",
  outline: "none",
  fontSize: "0.95rem",
  transition: "all 0.2s ease",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.9rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: `linear-gradient(135deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`,
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.95rem",
  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.25)",
  transition: "all 0.3s ease",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.85rem 1.3rem",
  borderRadius: "8px",
  border: `1.5px solid ${colors.border}`,
  backgroundColor: "#ffffff",
  color: colors.text,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.95rem",
  transition: "all 0.2s ease",
};

const successBoxStyle: React.CSSProperties = {
  marginBottom: "1.2rem",
  padding: "1rem 1.2rem",
  borderRadius: "8px",
  backgroundColor: colors.brandSoft,
  color: colors.brandDark,
  border: `1.5px solid ${colors.brandSoftBorder}`,
  fontSize: "0.95rem",
  fontWeight: 500,
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: "1rem",
  marginBottom: "1rem",
  padding: "1rem 1.2rem",
  borderRadius: "8px",
  backgroundColor: colors.dangerSoft,
  color: colors.dangerText,
  border: `1.5px solid ${colors.dangerBorder}`,
  fontSize: "0.95rem",
  fontWeight: 500,
};

const pageLoadingStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 50%, #f0f4f8 100%)",
  padding: "2rem",
};

const loadingCardStyle: React.CSSProperties = {
  padding: "2rem",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  border: `1.5px solid ${colors.border}`,
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
  color: colors.text,
  fontSize: "1.05rem",
  fontWeight: 500,
};

const loginPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 50%, #f0f4f8 100%)",

  padding: "2rem",
};

const loginCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  backgroundColor: "#ffffff",
  border: `1.5px solid ${colors.border}`,
  borderRadius: "12px",
  padding: "2.5rem",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
};

const loginHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1.5rem",
  marginBottom: "2rem",
};

const loginLogoStyle: React.CSSProperties = {
  width: "80px",
  height: "80px",
  objectFit: "contain",
  borderRadius: "12px",
  backgroundColor: colors.brandSoft,
  padding: "8px",
  boxShadow: "0 8px 20px rgba(16, 185, 129, 0.15)",
};

const loginTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.55rem",
  fontWeight: 800,
  color: colors.text,
  letterSpacing: "-0.5px",
};

const loginSubtitleStyle: React.CSSProperties = {
  margin: "0.4rem 0 0 0",
  color: colors.muted,
  fontSize: "0.95rem",
  fontWeight: 500,
};

const sectionTitleSmallStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.15rem",
  color: colors.text,
  fontWeight: 700,
};

const sectionMutedTextStyle: React.CSSProperties = {
  margin: "0.5rem 0 0 0",
  color: colors.muted,
  fontSize: "0.9rem",
};

const statsOverviewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const statsOverviewCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: `1.5px solid ${colors.border}`,
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  transition: "all 0.3s ease",
};

const statsOverviewLabelStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: colors.muted,
  fontWeight: 700,
  marginBottom: "0.6rem",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const statsOverviewValueStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 800,
  color: colors.text,
  lineHeight: 1.1,
};

const bookingModalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(4px)",
};

const bookingModalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1000px",
  maxHeight: "92vh",
  overflowY: "auto",
  padding: "2rem",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  border: `1.5px solid ${colors.border}`,
  boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
  boxSizing: "border-box",
  animation: "slideUp 0.3s ease",
};

const bookingModalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "1.5rem",
  marginBottom: "1.5rem",
  paddingBottom: "1.5rem",
  borderBottom: `1.5px solid ${colors.border}`,
};

const bookingModalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
  fontWeight: 800,
  color: colors.text,
  letterSpacing: "-0.5px",
};

const bookingModalCloseStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1.5px solid ${colors.border}`,
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: colors.muted,
  cursor: "pointer",
  fontSize: "1.2rem",
  flexShrink: 0,
  transition: "all 0.2s ease",
};

const modalTabRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.8rem",
  flexWrap: "wrap",
  marginBottom: "1.5rem",
  paddingBottom: "0",
  borderBottom: "none",
};

const modalTabButtonStyle: React.CSSProperties = {
  padding: "0.8rem 1.2rem",
  borderRadius: "8px",
  border: `1.5px solid ${colors.border}`,
  backgroundColor: "#ffffff",

  color: colors.muted,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.95rem",
  transition: "all 0.2s ease",
};

const activeModalTabButtonStyle: React.CSSProperties = {
   border: `1.5px solid ${colors.brand}`,
   backgroundColor: colors.brandSoft,
   color: colors.brandDark,
   fontWeight: 800,
};

const viewToggleStyle: React.CSSProperties = {
   display: "flex",
   gap: "0.5rem",
   borderRadius: "8px",
   backgroundColor: "#f8fafc",
   padding: "0.35rem",
   border: `1.5px solid ${colors.border}`,
};

const viewToggleButtonStyle: React.CSSProperties = {
   padding: "0.65rem 1.2rem",
   borderRadius: "6px",
   border: "1px solid transparent",
   backgroundColor: "transparent",
   color: colors.muted,
   cursor: "pointer",
   fontWeight: 600,
   fontSize: "0.9rem",
   transition: "all 0.2s ease",
};

const activeViewToggleButtonStyle: React.CSSProperties = {
   backgroundColor: "#ffffff",
   color: colors.brand,
   border: `1px solid ${colors.brandSoftBorder}`,
   fontWeight: 700,
   boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
};

export default AdminApp;