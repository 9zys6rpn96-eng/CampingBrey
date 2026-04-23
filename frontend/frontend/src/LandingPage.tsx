import React, { useEffect } from "react";

export function LandingPage() {
  useEffect(() => {
    document.title = "Campingplatz Brey";
  }, []);

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={brandStyle}>
            <img src="/logo.png" alt="Campingplatz Brey" style={logoStyle} />
            <div>
              <div style={brandTitleStyle}>Campingplatz Brey</div>
              <div style={brandSubtitleStyle}>Erholung am Rhein</div>
            </div>
          </div>

          <nav style={navStyle}>
            <a href="#campingplatz" style={navLinkStyle}>Campingplatz</a>
            <a href="#galerie" style={navLinkStyle}>Galerie</a>
            <a href="#ausstattung" style={navLinkStyle}>Ausstattung</a>
            <a href="#umgebung" style={navLinkStyle}>Umgebung</a>
            <a href="#kontakt" style={navLinkStyle}>Kontakt</a>
            <a href="/admin" style={adminLinkStyle}>Verwaltung</a>
          </nav>
        </div>
      </header>

      <main>
        <section style={heroSectionStyle}>
          <div style={heroImageStyle} />
          <div style={heroOverlayStyle} />
          <div style={heroContentStyle}>
            <div style={heroTextBlockStyle}>
              <div style={eyebrowStyle}>Camping · Natur · Rhein</div>
              <h1 style={heroTitleStyle}>
                Campingplatz Brey
                <br />
                Ruhe, Natur und entspannte Tage am Rhein
              </h1>
              <p style={heroTextStyle}>
                Willkommen auf dem Campingplatz Brey. Genießen Sie eine erholsame Zeit
                in naturnaher Umgebung mit angenehmer Atmosphäre, gut erreichbarer Lage
                und Platz für entspannte Urlaubstage.
              </p>

              <div style={heroButtonsStyle}>
                <a href="#kontakt" style={primaryCtaStyle}>Jetzt anfragen</a>
                <a href="#campingplatz" style={secondaryCtaStyle}>Mehr erfahren</a>
              </div>
            </div>
          </div>
        </section>

        <section id="campingplatz" style={sectionStyle}>
          <div style={sectionInnerStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionEyebrowStyle}>Campingplatz</div>
              <h2 style={sectionTitleStyle}>
                Ein Aufenthalt mit Ruhe, Struktur und schöner Lage
              </h2>
              <p style={sectionTextStyle}>
                Der Campingplatz Brey bietet einen angenehmen Ort für Gäste, die Erholung,
                Natur und eine ruhige Atmosphäre suchen. Ob Kurzaufenthalt oder längerer
                Urlaub – hier stehen Übersicht, Aufenthaltsqualität und entspannte Tage im Vordergrund.
              </p>
            </div>

            <div style={featureGridStyle}>
              <div style={featureCardStyle}>
                <div style={featureIconStyle}>🏕️</div>
                <h3 style={featureTitleStyle}>Verschiedene Platzarten</h3>
                <p style={featureTextStyle}>
                  Unterschiedliche Platzbereiche für verschiedene Aufenthaltsformen und Bedürfnisse.
                </p>
              </div>

              <div style={featureCardStyle}>
                <div style={featureIconStyle}>🌿</div>
                <h3 style={featureTitleStyle}>Ruhige Atmosphäre</h3>
                <p style={featureTextStyle}>
                  Ein angenehmes Umfeld zum Abschalten, Entspannen und Genießen.
                </p>
              </div>

              <div style={featureCardStyle}>
                <div style={featureIconStyle}>📍</div>
                <h3 style={featureTitleStyle}>Gute Ausgangslage</h3>
                <p style={featureTextStyle}>
                  Ein idealer Ausgangspunkt für Tage in der Region und am Rhein.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="galerie" style={altSectionStyle}>
          <div style={sectionInnerStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionEyebrowStyle}>Galerie</div>
              <h2 style={sectionTitleStyle}>Eindrücke vom Platz</h2>
              <p style={sectionTextStyle}>
                Hier kannst du später echte Fotos vom Campingplatz, den Stellplätzen,
                der Umgebung und der Rheinlage einsetzen. Schon mit 3 bis 6 guten Bildern
                wirkt die Seite sofort deutlich hochwertiger.
              </p>
            </div>

            <div style={galleryGridStyle}>
              <div style={galleryCardLargeStyle}>
                <div style={galleryPlaceholderStyle}>Großes Platzfoto</div>
              </div>

              <div style={gallerySideGridStyle}>
                <div style={galleryCardSmallStyle}>
                  <div style={galleryPlaceholderStyle}>Stellplätze</div>
                </div>
                <div style={galleryCardSmallStyle}>
                  <div style={galleryPlaceholderStyle}>Umgebung</div>
                </div>
                <div style={galleryCardSmallStyle}>
                  <div style={galleryPlaceholderStyle}>Rhein / Natur</div>
                </div>
                <div style={galleryCardSmallStyle}>
                  <div style={galleryPlaceholderStyle}>Atmosphäre</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ausstattung" style={sectionStyle}>
          <div style={sectionInnerStyle}>
            <div style={twoColumnStyle}>
              <div>
                <div style={sectionEyebrowStyle}>Ausstattung</div>
                <h2 style={sectionTitleStyle}>Alles für einen angenehmen Aufenthalt</h2>
                <p style={sectionTextStyle}>
                  Dieser Bereich kann mit deinen echten Informationen aus der bisherigen
                  Website ergänzt werden. Für die erste Version setzen wir auf eine klare
                  und hochwertige Darstellung statt auf Überladung.
                </p>
              </div>

              <div style={listCardStyle}>
                <div style={listItemStyle}>✓ Ruhige Platzstruktur</div>
                <div style={listItemStyle}>✓ Übersichtliche Stellplatzbereiche</div>
                <div style={listItemStyle}>✓ Naturnahe Umgebung</div>
                <div style={listItemStyle}>✓ Gute Erreichbarkeit</div>
                <div style={listItemStyle}>✓ Angenehme Aufenthaltsatmosphäre</div>
              </div>
            </div>
          </div>
        </section>

        <section id="umgebung" style={altSectionStyle}>
          <div style={sectionInnerStyle}>
            <div style={sectionHeaderStyle}>
              <div style={sectionEyebrowStyle}>Umgebung</div>
              <h2 style={sectionTitleStyle}>Brey und die Region entdecken</h2>
              <p style={sectionTextStyle}>
                Die Lage des Campingplatzes bietet eine gute Basis für Ausflüge, Spaziergänge
                und entspannte Tage in der Region. Hier können später noch konkrete Tipps,
                Ziele und Hinweise ergänzt werden.
              </p>
            </div>

            <div style={infoGridStyle}>
              <div style={infoCardStyle}>
                <h3 style={infoTitleStyle}>Natur & Erholung</h3>
                <p style={infoTextStyle}>
                  Perfekt für ruhige Tage und eine entspannte Auszeit.
                </p>
              </div>

              <div style={infoCardStyle}>
                <h3 style={infoTitleStyle}>Rheinlage</h3>
                <p style={infoTextStyle}>
                  Eine attraktive Region für schöne Aufenthalte und Erkundungen.
                </p>
              </div>

              <div style={infoCardStyle}>
                <h3 style={infoTitleStyle}>Ausgangspunkt für Ausflüge</h3>
                <p style={infoTextStyle}>
                  Gut geeignet für kurze und längere Unternehmungen in der Umgebung.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="kontakt" style={contactSectionStyle}>
          <div style={sectionInnerStyle}>
            <div style={contactCardStyle}>
              <div>
                <div style={sectionEyebrowStyle}>Kontakt</div>
                <h2 style={sectionTitleStyle}>Interesse an einem Aufenthalt?</h2>
                <p style={sectionTextStyle}>
                  Hier können später Kontaktformular, Telefonnummer, E-Mail, Preise
                  und weitere Informationen ergänzt werden. Für den ersten Stand reicht
                  eine klare und vertrauenswürdige Kontaktsektion.
                </p>
              </div>

              <div style={contactBoxStyle}>
                <div style={contactLineStyle}><strong>E-Mail:</strong> info@campingplatz-brey.de</div>
                <div style={contactLineStyle}><strong>Telefon:</strong> +49 0000 000000</div>
                <div style={contactLineStyle}><strong>Ort:</strong> Brey am Rhein</div>

                <div style={{ marginTop: "1rem" }}>
                  <a href="#campingplatz" style={secondaryCtaStyle}>Mehr zum Platz</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={footerStyle}>
        <div style={footerInnerStyle}>
          <div>© Campingplatz Brey</div>

          <div style={footerLinksStyle}>
            <a href="/admin" style={footerLinkStyle}>Betreiber-Login</a>
            <span>Impressum</span>
            <span>Datenschutz</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#f7faf8",
  color: "#163126",
  fontFamily: "system-ui, sans-serif",
};

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  backgroundColor: "rgba(248, 250, 249, 0.92)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid #d7e4db",
};

const headerInnerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "0.9rem 1.5rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
  boxSizing: "border-box",
};

const brandStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
};

const logoStyle: React.CSSProperties = {
  width: "54px",
  height: "54px",
  objectFit: "contain",
  borderRadius: "999px",
  backgroundColor: "white",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 800,
  lineHeight: 1.1,
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#5f766b",
  marginTop: "0.15rem",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const navLinkStyle: React.CSSProperties = {
  color: "#355447",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
};

const adminLinkStyle: React.CSSProperties = {
  color: "#5f766b",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.84rem",
  opacity: 0.8,
};

const heroSectionStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "82vh",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  backgroundColor: "#e5efe8",
};

const heroImageStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.16) 0%, rgba(240,249,255,0.16) 100%), url('/hero-placeholder.jpg') center/cover no-repeat",
  filter: "saturate(1.02)",
};

const heroOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, rgba(12,24,18,0.62) 0%, rgba(12,24,18,0.38) 35%, rgba(12,24,18,0.12) 100%)",
};

const heroContentStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "4rem 1.5rem",
  boxSizing: "border-box",
};

const heroTextBlockStyle: React.CSSProperties = {
  maxWidth: "760px",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 800,
  color: "#bbf7d0",
  marginBottom: "0.8rem",
};

const heroTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(2.6rem, 6vw, 5rem)",
  lineHeight: 1.02,
  fontWeight: 900,
  color: "#ffffff",
};

const heroTextStyle: React.CSSProperties = {
  marginTop: "1.2rem",
  fontSize: "1.08rem",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.92)",
  maxWidth: "680px",
};

const heroButtonsStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.8rem",
  flexWrap: "wrap",
  marginTop: "1.6rem",
};

const primaryCtaStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.9rem 1.2rem",
  borderRadius: "0.9rem",
  background: "linear-gradient(135deg, #15803d 0%, #166534 100%)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
  boxShadow: "0 10px 24px rgba(21, 128, 61, 0.22)",
};

const secondaryCtaStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "0.9rem 1.2rem",
  borderRadius: "0.9rem",
  backgroundColor: "rgba(255,255,255,0.96)",
  border: "1px solid #d7e4db",
  color: "#163126",
  textDecoration: "none",
  fontWeight: 800,
};

const sectionStyle: React.CSSProperties = {
  padding: "5rem 0",
};

const altSectionStyle: React.CSSProperties = {
  padding: "5rem 0",
  backgroundColor: "#eef6f1",
};

const contactSectionStyle: React.CSSProperties = {
  padding: "5rem 0 6rem 0",
};

const sectionInnerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "0 1.5rem",
  boxSizing: "border-box",
};

const sectionHeaderStyle: React.CSSProperties = {
  maxWidth: "780px",
  marginBottom: "2rem",
};

const sectionEyebrowStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 800,
  color: "#166534",
  marginBottom: "0.6rem",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
  lineHeight: 1.12,
  color: "#163126",
};

const sectionTextStyle: React.CSSProperties = {
  marginTop: "0.9rem",
  color: "#5f766b",
  lineHeight: 1.7,
  fontSize: "1rem",
};

const featureGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const featureCardStyle: React.CSSProperties = {
  padding: "1.3rem",
  borderRadius: "1rem",
  backgroundColor: "white",
  border: "1px solid #d7e4db",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const featureIconStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "0.8rem",
};

const featureTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.05rem",
  fontWeight: 800,
  color: "#163126",
};

const featureTextStyle: React.CSSProperties = {
  marginTop: "0.55rem",
  color: "#5f766b",
  lineHeight: 1.6,
};

const galleryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr",
  gap: "1rem",
  alignItems: "stretch",
};

const gallerySideGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
};

const galleryCardLargeStyle: React.CSSProperties = {
  minHeight: "420px",
  borderRadius: "1.2rem",
  overflow: "hidden",
  border: "1px solid #d7e4db",
  backgroundColor: "#dfe8e2",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const galleryCardSmallStyle: React.CSSProperties = {
  minHeight: "200px",
  borderRadius: "1rem",
  overflow: "hidden",
  border: "1px solid #d7e4db",
  backgroundColor: "#dfe8e2",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const galleryPlaceholderStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#355447",
  fontWeight: 700,
  background:
    "linear-gradient(135deg, rgba(220,252,231,0.8) 0%, rgba(224,242,254,0.8) 100%)",
};

const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: "1.2rem",
  alignItems: "start",
};

const listCardStyle: React.CSSProperties = {
  padding: "1.3rem",
  borderRadius: "1rem",
  backgroundColor: "white",
  border: "1px solid #d7e4db",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const listItemStyle: React.CSSProperties = {
  padding: "0.7rem 0",
  borderBottom: "1px solid #eef2f7",
  color: "#355447",
  fontWeight: 600,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1rem",
};

const infoCardStyle: React.CSSProperties = {
  padding: "1.3rem",
  borderRadius: "1rem",
  backgroundColor: "white",
  border: "1px solid #d7e4db",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};

const infoTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.05rem",
  fontWeight: 800,
};

const infoTextStyle: React.CSSProperties = {
  marginTop: "0.55rem",
  color: "#5f766b",
  lineHeight: 1.6,
};

const contactCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: "1.2rem",
  padding: "1.4rem",
  borderRadius: "1.2rem",
  background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
  border: "1px solid #d7e4db",
  boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
};

const contactBoxStyle: React.CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  backgroundColor: "white",
  border: "1px solid #d7e4db",
};

const contactLineStyle: React.CSSProperties = {
  marginBottom: "0.75rem",
  color: "#355447",
  lineHeight: 1.5,
};

const footerStyle: React.CSSProperties = {
  borderTop: "1px solid #d7e4db",
  backgroundColor: "#ffffff",
};

const footerInnerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "1.2rem 1.5rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
  boxSizing: "border-box",
  color: "#5f766b",
};

const footerLinksStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#355447",
  textDecoration: "none",
};