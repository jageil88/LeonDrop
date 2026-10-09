# LeonDrop

LeonDrop ist eine responsive Web-App als persönliche Übergabestation für Texte, Links und Dateien zwischen Handy und Laptop.

## Aktueller Stand

Diese Version ist ein **funktionierender Frontend-Prototyp**:
- Texte und Links können angelegt, kopiert, geöffnet und gelöscht werden.
- Dateien und Bilder können in der aktuellen Sitzung hinzugefügt werden.
- Responsive dunkles Design, heller Modus, Verlauf und PWA-Grundlage.
- Texte/Links werden im lokalen Browser gespeichert.

**Wichtig:** Diese Version synchronisiert NICHT zwischen Geräten. Jedes Gerät hat eigenen Browser-Speicher. Dateien sind nach einem Neuladen nicht garantiert verfügbar. Es gibt noch keinen Server, keine Anmeldung und keinen gemeinsamen Cloud-Verlauf.

## Schnell starten

1. ZIP entpacken.
2. `index.html` im Browser öffnen.
3. Auf dem Handy und Laptop testen.

Für Service Worker/PWA-Funktionen muss die Seite über HTTPS oder einen lokalen Entwicklungsserver bereitgestellt werden.

## Nächster Schritt: echte Synchronisierung

Um Handy und Laptop zu verbinden, muss ein gemeinsamer Backend-Dienst eingerichtet werden. Eine mögliche Lösung:
1. Supabase-Projekt erstellen.
2. Tabelle für Drops mit Benutzer-/Raum-ID, Inhalt, Typ und Zeitstempel anlegen.
3. Supabase Realtime abonnieren, damit neue Drops sofort auf beiden Geräten erscheinen.
4. Supabase Storage für Dateien verwenden.
5. Privaten Zugangscode oder Authentifizierung und Row Level Security konfigurieren.
6. Zugangsdaten als öffentliche Client-Konfiguration nutzen, aber niemals `service_role`-Schlüssel in den Browser einbauen.

Für einen privaten persönlichen Bereich sollte vor dem Hochladen sensibler Inhalte zuerst Authentifizierung und Zugriffsschutz eingerichtet werden.

## Zwischenablage

Browser erlauben keinen dauerhaften, stillen Zugriff auf die Zwischenablage. LeonDrop nutzt daher eine bewusste Aktion zum Kopieren. Für vollautomatische Clipboard-Synchronisierung wäre eine separate App/Browser-Erweiterung oder eine vom Betriebssystem unterstützte Funktion erforderlich.
