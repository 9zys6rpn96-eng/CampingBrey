# Migration: `nationality` in `bookings`

Die Anwendung legt neue Tabellen mit `Base.metadata.create_all()` an, erweitert bestehende Tabellen aber nicht automatisch.

Damit bestehende Installationen das neue optionale Feld `nationality` in `bookings` erhalten, muss auf jeder bestehenden Datenbank einmalig folgendes SQL ausgeführt werden:

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS nationality VARCHAR;
```

Bitte diesen Befehl **lokal** und auf dem **Server / Produktionssystem** ausführen, falls dort bereits eine `bookings`-Tabelle existiert.

