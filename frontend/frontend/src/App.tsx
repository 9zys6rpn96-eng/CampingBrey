import { useEffect, useMemo, useState } from "react";
import type { Place, Booking, PlaceStatus } from "./types";
import {
  fetchPlaces,
  fetchBookings,
  fetchPlaceStatuses,
  login,
  fetchMe,
  createUser,
} from "./services/api";
import { PlaceList } from "./components/PlaceList";
import { PlaceDetailPanel } from "./components/PlaceDetailPanel";
import { CampingMap } from "./components/CampingMap";

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [placeStatuses, setPlaceStatuses] = useState<PlaceStatus[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const weekStartIso = useMemo(() => toIsoDate(weekStart), [weekStart]);
  const weekEndIso = useMemo(() => toIsoDate(addDays(weekStart, 6)), [weekStart]);
  const selectedDateIso = weekStartIso;
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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
      } catch {
        localStorage.removeItem("auth_token");
        setCurrentUser(null);
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
        if (!hasLoadedOnce) {
          setLoading(true);
        }

        setError(null);

        const [placesData, bookingsData, statusData] = await Promise.all([
          fetchPlaces(),
          fetchBookings(),
          fetchPlaceStatuses(weekStartIso, weekEndIso),
        ]);

        const sortedPlaces = sortPlacesByName(placesData);

        setPlaces(sortedPlaces);
        setBookings(bookingsData);
        setPlaceStatuses(statusData);

        setSelectedPlaceId((prev) => {
          if (prev === null) {
            return null;
          }

          const stillExists = sortedPlaces.find((p) => p.id === prev);
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
  }, [currentUser, weekStartIso, weekEndIso, hasLoadedOnce]);

  async function reloadData() {
    if (!currentUser) return;

    try {
      setError(null);

      const [placesData, bookingsData, statusData] = await Promise.all([
        fetchPlaces(),
        fetchBookings(),
        fetchPlaceStatuses(weekStartIso, weekEndIso),
      ]);

      const sortedPlaces = sortPlacesByName(placesData);

      setPlaces(sortedPlaces);
      setBookings(bookingsData);
      setPlaceStatuses(statusData);

      setSelectedPlaceId((prev) => {
        if (prev === null) {
          return null;
        }

        const stillExists = sortedPlaces.find((p) => p.id === prev);
        return stillExists ? prev : null;
      });
    } catch (err) {
      console.error(err);
      setError("Fehler beim Laden der Daten");
    }
  }

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;
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

        return acc;
      },
      { green: 0, yellow: 0, red: 0, gray: 0 }
    );
  }, [placeStatuses]);

  function handleDateChange(value: string) {
    if (!value) return;

    const selectedDate = new Date(value);
    selectedDate.setHours(0, 0, 0, 0);
    setWeekStart(selectedDate);
  }

  function goToCurrentWeek() {
    setWeekStart(startOfWeek(new Date()));
  }

  function goToPreviousDay() {
    setWeekStart((prev) => addDays(prev, -1));
  }

  function goToNextDay() {
    setWeekStart((prev) => addDays(prev, 1));
  }

  function goToPreviousWeek() {
    setWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setWeekStart((prev) => addDays(prev, 7));
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
    } catch (err: any) {
      setUserCreateError(err.message || "Fehler beim Erstellen des Benutzers");
    }
  }

  function handleSelectPlace(placeId: number) {
    setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
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

      <div style={pageContentStyle}>
        {actionSuccess && <div style={successBoxStyle}>{actionSuccess}</div>}

        <section style={heroCardStyle}>
          <div>
            <div style={eyebrowStyle}>Angezeigter Zeitraum</div>
            <div style={heroDateStyle}>
              {formatDate(weekStartIso)} – {formatDate(weekEndIso)}
            </div>
            <p style={heroTextStyle}>
              Plätze auswählen, Buchungen ansehen und die Belegung direkt über die Karte verwalten.
            </p>
          </div>

          <div style={heroControlsStyle}>
            <div style={dateInputWrapperStyle}>
              <label style={labelStyle}>Startdatum wählen</label>
              <input
                  type="date"
                  value={selectedDateIso}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={inputStyle}
              />
            </div>

            <div style={toolbarGroupStyle}>
              <button onClick={goToCurrentWeek} style={softButtonStyle}>
                Diese Woche
              </button>
              <button onClick={goToPreviousDay} style={softButtonStyle}>
                ← Tag
              </button>
              <button onClick={goToNextDay} style={softButtonStyle}>
                Tag →
              </button>
              <button onClick={goToPreviousWeek} style={softButtonStyle}>
                ← Woche
              </button>
              <button onClick={goToNextWeek} style={softButtonStyle}>
                Woche →
              </button>
            </div>
          </div>
        </section>

        <section style={statsOverviewGridStyle}>
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
        </section>

        {currentUser.role === "developer" && (
            <section style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <h2 style={cardTitleStyle}>Benutzerverwaltung</h2>
                  <p style={cardSubtitleStyle}>
                    Neuen Operator oder Developer für die Anwendung anlegen.
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
            </section>
        )}

        {loading && !hasLoadedOnce && (
            <div style={loadingCardStyle}>Lade Daten...</div>
        )}

        {error && <div style={errorBoxStyle}>{error}</div>}

        {!error && hasLoadedOnce && (
            <div style={dashboardGridStyle}>
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
                    <div>
                      <h2 style={cardTitleStyle}>Karte</h2>
                      <p style={cardSubtitleStyle}>
                        Wähle einen Platz direkt über die Karte oder über die Liste links.
                      </p>
                    </div>
                  </div>

                  <CampingMap
                      places={places}
                      placeStatuses={placeStatuses}
                      selectedPlaceId={selectedPlaceId}
                      onSelectPlace={handleSelectPlace}
                      isDeveloper={currentUser.role === "developer"}
                  />
                </section>

                <section style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <div>
                      <h2 style={cardTitleStyle}>Platzdetails</h2>
                      <p style={cardSubtitleStyle}>
                        Informationen, Belegung und Buchungen des ausgewählten Platzes.
                      </p>
                    </div>
                  </div>

                  <PlaceDetailPanel
                      place={selectedPlace}
                      bookings={bookingsForSelectedPlace}
                      onBookingCreated={reloadData}
                  />
                </section>
              </main>
            </div>
        )}
      </div>
    </div>
  );
}

const colors = {
  pageBg: "#eef6f1",
  pageBgAlt: "#f7faf8",
  cardBg: "#ffffff",
  border: "#d7e4db",
  borderStrong: "#bfd4c7",
  text: "#163126",
  muted: "#5f766b",
  brand: "#15803d",
  brandDark: "#166534",
  brandSoft: "#dcfce7",
  brandSoftBorder: "#bbf7d0",
  accentBlueSoft: "#e0f2fe",
  accentBlueBorder: "#bae6fd",
  dangerSoft: "#fee2e2",
  dangerBorder: "#fecaca",
  dangerText: "#991b1b",
};

const appShellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
      "linear-gradient(180deg, #e8f5ec 0%, #eef6f1 220px, #f7faf8 220px, #f7faf8 100%)",
  color: colors.text,
  fontFamily: "system-ui, sans-serif",
};

const topBarStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  backdropFilter: "blur(10px)",
  backgroundColor: "rgba(248, 250, 249, 0.88)",
  borderBottom: `1px solid ${colors.border}`,
};

const topBarInnerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto",
  padding: "0.95rem 1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
  boxSizing: "border-box",
};

const brandBlockStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.9rem",
};

const brandLogoStyle: React.CSSProperties = {
  width: "56px",
  height: "56px",
  objectFit: "contain",
  borderRadius: "999px",
  backgroundColor: "white",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: "1.15rem",
  fontWeight: 800,
  color: colors.text,
  lineHeight: 1.1,
};

const brandSubtitleStyle: React.CSSProperties = {
  marginTop: "0.2rem",
  fontSize: "0.92rem",
  color: colors.muted,
};

const headerRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const userBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.55rem 0.8rem",
  borderRadius: "999px",
  backgroundColor: "#ffffff",
  border: `1px solid ${colors.border}`,
  color: colors.text,
};

const pageContentStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1600px",
  margin: "0 auto",
  padding: "1.5rem",
  boxSizing: "border-box",
};

const heroCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1.25rem",
  flexWrap: "wrap",
  marginBottom: "1rem",
  padding: "1.35rem 1.4rem",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,253,244,0.96) 100%)",
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: "1rem",
  boxShadow: "0 10px 24px rgba(21, 128, 61, 0.08)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: colors.brandDark,
  marginBottom: "0.35rem",
};

const heroDateStyle: React.CSSProperties = {
  fontSize: "1.45rem",
  fontWeight: 800,
  color: colors.text,
};

const heroTextStyle: React.CSSProperties = {
  margin: "0.45rem 0 0 0",
  color: colors.muted,
  maxWidth: "720px",
  lineHeight: 1.5,
};

const heroControlsStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap",
  alignItems: "end",
  justifyContent: "flex-end",
};

const dateInputWrapperStyle: React.CSSProperties = {
  minWidth: "220px",
};

const toolbarGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const dashboardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: "1rem",
  alignItems: "start",
};

const sidebarCardStyle: React.CSSProperties = {
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: "1rem",
  padding: "1rem",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  minHeight: "700px",
  boxSizing: "border-box",
};

const sidebarContentStyle: React.CSSProperties = {
  maxHeight: "720px",
  overflowY: "auto",
  paddingRight: "0.25rem",
};

const mainColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "min-content 1fr",
  gap: "1rem",
  minHeight: "700px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: "1rem",
  padding: "1rem",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  boxSizing: "border-box",
};

const cardHeaderStyle: React.CSSProperties = {
  marginBottom: "0.9rem",
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.08rem",
  fontWeight: 800,
  color: colors.text,
};

const cardSubtitleStyle: React.CSSProperties = {
  margin: "0.3rem 0 0 0",
  color: colors.muted,
  fontSize: "0.94rem",
};

const formRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.85rem",
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
  marginBottom: "0.35rem",
  color: colors.muted,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.82rem",
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: "0.75rem",
  backgroundColor: "#ffffff",
  color: colors.text,
  boxSizing: "border-box",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.78rem 1.05rem",
  borderRadius: "0.75rem",
  border: `1px solid ${colors.brand}`,
  background: `linear-gradient(135deg, ${colors.brand} 0%, ${colors.brandDark} 100%)`,
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 8px 18px rgba(21, 128, 61, 0.20)",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.7rem 1rem",
  borderRadius: "0.75rem",
  border: `1px solid ${colors.borderStrong}`,
  backgroundColor: "#ffffff",
  color: colors.text,
  cursor: "pointer",
  fontWeight: 600,
};

const softButtonStyle: React.CSSProperties = {
  padding: "0.68rem 0.95rem",
  borderRadius: "0.75rem",
  border: `1px solid ${colors.borderStrong}`,
  backgroundColor: "#ffffff",
  color: colors.text,
  cursor: "pointer",
  fontWeight: 600,
};

const successBoxStyle: React.CSSProperties = {
  marginBottom: "1rem",
  padding: "0.8rem 1rem",
  borderRadius: "0.8rem",
  backgroundColor: colors.brandSoft,
  color: colors.brandDark,
  border: `1px solid ${colors.brandSoftBorder}`,
  fontSize: "0.95rem",
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: "1rem",
  marginBottom: "1rem",
  padding: "0.8rem 1rem",
  borderRadius: "0.8rem",
  backgroundColor: colors.dangerSoft,
  color: colors.dangerText,
  border: `1px solid ${colors.dangerBorder}`,
  fontSize: "0.95rem",
};

const pageLoadingStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(180deg, #e8f5ec 0%, #eef6f1 220px, #f7faf8 220px, #f7faf8 100%)",
  padding: "1.5rem",
};

const loadingCardStyle: React.CSSProperties = {
  padding: "1rem 1.2rem",
  borderRadius: "1rem",
  backgroundColor: "#ffffff",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  color: colors.text,
};

const loginPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top, #dcfce7 0%, #eef6f1 35%, #f7faf8 100%)",
  padding: "1.5rem",
};

const loginCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "460px",
  backgroundColor: "#ffffff",
  border: `1px solid ${colors.border}`,
  borderRadius: "1.25rem",
  padding: "1.6rem",
  boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
};

const loginHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "1.35rem",
};

const loginLogoStyle: React.CSSProperties = {
  width: "72px",
  height: "72px",
  objectFit: "contain",
  borderRadius: "999px",
  backgroundColor: "#ffffff",
};

const loginTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.45rem",
  fontWeight: 800,
  color: colors.text,
};

const loginSubtitleStyle: React.CSSProperties = {
  margin: "0.25rem 0 0 0",
  color: colors.muted,
};

const sectionTitleSmallStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.1rem",
  color: colors.text,
};

const sectionMutedTextStyle: React.CSSProperties = {
  margin: "0.35rem 0 0 0",
  color: colors.muted,
};

const statsOverviewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "0.85rem",
  marginBottom: "1rem",
};

const statsOverviewCardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: `1px solid ${colors.border}`,
  borderRadius: "1rem",
  padding: "1rem",
  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const statsOverviewLabelStyle: React.CSSProperties = {
  fontSize: "0.88rem",
  color: colors.muted,
  fontWeight: 700,
  marginBottom: "0.35rem",
};

const statsOverviewValueStyle: React.CSSProperties = {
  fontSize: "1.55rem",
  fontWeight: 800,
  color: colors.text,
};

export default App;