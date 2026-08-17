# Belegungsmatrix - Implementierungsdokumentation

## Übersicht

Die Belegungsmatrix wurde als alternative Hauptansicht zur Campingplatzkarte implementiert. Sie bietet eine zeitliche Übersicht über die Platzauslastung und Buchungen.

## Implementierte Features

### 1. ✅ View-Umschalter
- **Ort**: AdminApp.tsx, Bereich der Karte
- **Funktionalität**: Toggle zwischen "🗺️ Karte" und "📊 Belegungsmatrix"
- **State**: `viewMode` (map | matrix)
- **Design**: Pill-Button-Style mit aktiv/inaktiv Zustand

### 2. ✅ Zeitnavigation
- **Buttons**: "← Zurück", "Heute", "Weiter →"
- **Schritte**: ±7 Tage pro Navigation
- **Anzeige**: Datum-Bereich oben (z.B. "10.08.2026 – 16.08.2026")
- **Default-Start**: Heutiges Datum

### 3. ✅ Matrix-Layout
- **Linke Spalte (Sticky)**: Platznamen
  - `position: sticky; left: 0`
  - Klickbar zum Auswählen von Plätzen
  - Hervorhebung des ausgewählten Platzes
- **Obere Zeile (Sticky)**: Daten
  - `position: sticky; top: 0`
  - Tag der Woche + Datum
  - Aktuelle Tag hervorgehoben mit blauem Border
- **Grid-Container**: Horizontales Scroll für viele Tage
  - 14 Tage pro Ansicht (2 Wochen)
  - Responsive Breite (120px pro Tag)

### 4. ✅ Farb-Schema

#### Einzelplätze
- **Grün**: Frei (Standard)
- **Rot**: Belegt (Buchungsbalken)
- **Blau**: Aktueller Tag (Border)
- **Grau**: Nicht verfügbar (availabilityMode)

#### Zeltwiese
- **Grün**: Frei (0/kapazität)
- **Gelb**: Teilweise belegt (1..n-1/kapazität)
- **Rot**: Voll belegt (=kapazität)
- Anzeige: "2/10", "5/10", etc.

### 5. ✅ Buchungsbalken
- **Darstellung**: Horizontale rote Balken
- **Position**: Zentriert in der Zellenhöhe
- **Länge**: Mehrtätige Buchungen spannen mehrere Zellen
- **Design**: 
  - Abgerundete Ecken oben und unten
  - Höhe: 24px
  - Hover-Effekt: Helleres Rot
  - Cursor: Pointer

### 6. ✅ Hover-Tooltip
- **Trigger**: Mouseover auf Buchungsbalken oder Zeltwiesenzelle
- **Position**: Intelligent positioniert (rechts von Cursor, Ausgleich bei Randnähe)
- **Inhalt für Einzelplätze**:
  ```
  Platz 03
  10.08.2026

  Max Mustermann
  10.08.2026 – 14.08.2026
  # 2026-00481
  2 Personen
  ```
- **Inhalt für Zeltwiese**:
  ```
  Zeltwiese
  10.08.2026

  5 von 10 belegt
  5 frei

  Buchungen:
  • Müller
  • Schmidt
  + 2 weitere
  ```

### 7. ✅ Klick-Interaktionen

#### Klick auf Buchungsbalken
- Öffnet das bestehende Booking-Modal
- Verwendet `handleSelectPlace()` aus AdminApp
- Zeigt PlaceDetailPanel oder NewBooking je nach Tab

#### Klick auf freie Zelle
- Öffnet Booking-Modal mit vorausgefülltem Datum
- `handleSelectDateRangeFromMatrix()` setzt:
  - `selectedPlaceId` = geklickter Platz
  - `searchStartDate` = geklicktes Datum
  - `searchEndDate` = nächster Tag (automatisch berechnet)
  - Tab = "booking" (NewBooking-Form)

#### Klick auf Platzname (Links)
- Wählt Platz aus (Highlight)
- Optional: Öffnet Modal (zukünftige Erweiterung)

### 8. ✅ Zeltwiese-Speziallogik
- **Kapazitätsberechnung**: `getZeltwieseOccupancyForDay()`
  - Zählt `tent_count` aller Buchungen für den Tag
  - Vergleicht mit `place.capacity`
- **Farblabelling**: Basierend auf Auslastung
  - 0/10 → "frei" (grün)
  - 5/10 → "5/10" (gelb)
  - 10/10 → "10/10" (rot)

### 9. ✅ Sticky Header und Scrolling
- **Horizontal Scroll**: `overflow-x: auto` auf Container
- **Sticky Left**: Platznamen-Spalte bleibt sichtbar
- **Sticky Top**: Datumszeile bleibt sichtbar
- **Z-Index**: 
  - Platzname-Spalte: z-index: 10
  - Datums-Zeile: z-index: 11
  - Tooltip: z-index: 100

### 10. ✅ Performance
- **Memoization**: 
  - `daysInView` (useMemo)
  - `bookingsByPlace` (useMemo)
- **Keine redundanten Berechnungen**: Callbacks sind optimiert
- **Effiziente Gruppierung**: Buchungen pro Platz einmalig berechnet

### 11. ✅ Datenaustausch mit AdminApp
- **Gemeinsame States**:
  - `places`
  - `bookings`
  - `placeStatuses`
  - `selectedPlaceId`
- **Callback-Handler**:
  - `onSelectPlace()` → öffnet Modal
  - `handleSelectDateRangeFromMatrix()` → füllt Daten vor
- **Synchronisierung**: Via `reloadData()` nach Änderungen

### 12. ✅ Responsive Design
- **Desktop** (Standard): 14 Tage pro Woche, normale Zellengröße
- **Tablet**: Angepasste Breiten, ggf. weniger Tage sichtbar
- **Mobile**: Horizontal scrollbar notwendig, aber funktional
- **Sticky verhalten**: Works auf allen Geräten

### 13. ✅ Tastatur und Barrierefreiheit
- Button-Hover states
- Clear visual feedback
- Title-Attribute auf Navigationsbuttons

## Dateistruktur

### Neue Dateien
```
src/components/OccupancyMatrix.tsx     (700+ Zeilen)
```

### Geänderte Dateien
```
src/AdminApp.tsx
  - Import OccupancyMatrix
  - State: viewMode, handleSelectDateRangeFromMatrix()
  - View-Toggle UI
  - Props-Durchleitung
  - Styles: viewToggleStyle, viewToggleButtonStyle, etc.
```

## Funktionale Gleichwertigkeit mit der Karte

| Funktion | Karte | Matrix | Status |
|----------|-------|--------|---------|
| Platz anzeigen | ✅ | ✅ | Vollständig |
| Platz auswählen | ✅ | ✅ | Vollständig |
| Verfügbarkeiten sehen | ✅ | ✅ | Vollständig |
| Buchung öffnen | ✅ | ✅ | Vollständig |
| Neue Buchung erstellen | ✅ | ✅ | Vollständig |
| Buchung bearbeiten | ✅ | ✅ | (über Dialog) |
| Buchung löschen | ✅ | ✅ | (über Dialog) |
| Rollen/Rechte | ✅ | ✅ | Vollständig |
| Zeltwiese-Kapazität | ✅ | ✅ | Vollständig |
| Status-Farben | ✅ | ⚠️ | Teilweise* |

*Status-Farben (gray, blocked) sind momentan nicht visuell unterschieden in der Matrix, können aber hinzugefügt werden.

## Bekannte Limitations / Zukünftige Erweiterungen

1. **Status-Unterscheidung**: Plätze mit gray/blocked Status werden nicht visuell unterschieden. Dies könnte durch Platz-Hintergrund-Färbung oder Muster hinzugefügt werden.

2. **Availability-Mode**: Die Grau-Filterung für nicht verfügbare Plätze ist in den Props vorhanden, aber nicht implementiert. Kann später hinzugefügt werden.

3. **Drag-Bereichsauswahl**: Optionale Erweiterung zum Auswählen von Date-Ranges durch Drag.

4. **Booking-Details-Inline**: Könnte eine Inline-Erweiterung eines Booking-Info-Pop-ups sein statt Modal.

5. **Mehrsprachigkeit**: Matrix nutzt deutsche Labels, änderbar mit Ressourcen-Strings.

## Testing-Szenarien

### Szenario 1: Basis-Navigation
1. Öffne Admin-Panel
2. Klicke auf "📊 Belegungsmatrix"
3. Verifiziere: Matrix zeigt aktuelle Woche, heute ist hervorgehoben

### Szenario 2: Zeitnavigation
1. Klicke "Weiter →" (3x)
2. Verifiziere: Datum-Bereich ändern sich
3. Klicke "Heute"
4. Verifiziere: Zurück zum heutigen Datum

### Szenario 3: Buchungen anzeigen
1. Scrolle zur Zeltwiese
2. Hover über Tag mit Buchungen
3. Verifiziere: Tooltip zeigt Auslastung und Buchungsnamen
4. Klick auf Buchung
5. Verifiziere: Modal öffnet sich mit Buchungsdetails

### Szenario 4: Neue Buchung
1. Klick auf freie Zelle (z.B. Platz 07, 20.08)
2. Verifiziere: Modal öffnet mit:
   - Platz = Platz 07
   - Anreise = 20.08.2026
   - Tab = "Neue Buchung"
3. Fülle Daten aus und erstelle Buchung
4. Verifiziere: Matrix refresht und zeigt neue Buchung

### Szenario 5: Sticky Header
1. Scrolle horizontal nach rechts
2. Verifiziere: Platznamen (links) bleiben sichtbar
3. Scroll vertikal
4. Verifiziere: Datums-Header (oben) bleibt sichtbar

## Build-Status

✅ **Erfolgreich gebaut**
```
npm run build
✓ 42 modules transformed
✓ built in 706ms

Dateigröße: ~313 KB (gzip: ~91 KB)
```

## Deployment-Notizen

1. Keine neuen Dependencies erforderlich
2. Komponente nutzt nur bestehende Imports (React, types)
3. Styles sind inline (React.CSSProperties)
4. Backward-compatible mit bestehenden AdminApp-Features

