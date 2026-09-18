# Game Center

Game Center ist eine Angular-PWA zum Verwalten von Spielern, Rankings und
verschiedenen Brettspielen. Das Angular-Projekt liegt direkt im Repository-Root.

## Entwicklung

```bash
npm install
npm start
```

Die App ist danach unter `http://localhost:4200/` erreichbar.

Für die lokale Supabase-Konfiguration wird die von Git ignorierte Datei
`src/environments/environment.ts` benötigt. Als Vorlage dient
`src/environments/environment.example.ts`. Der verwendete Key muss ein
Supabase-Publishable-Key sein, niemals ein `service_role`-Key.

## Build, Tests und Deployment

```bash
npm run build
npm test
npm run deploy
```

Der Produktionsbuild wird unter `dist/frontend` erzeugt. `npm run deploy` baut
die App mit dem GitHub-Pages-Unterpfad `/game-center/` und veröffentlicht
`dist/frontend/browser` auf dem Branch `gh-pages`.

In GitHub unter **Settings > Pages** auswählen:

- **Source:** Deploy from a branch
- **Branch:** `gh-pages`
- **Folder:** `/ (root)`

Der Produktionsbuild verwendet den Live-Unterpfad `/game-center/`.

## Aktueller Funktionsumfang

### Funktioniert

- Registrierung und Anmeldung über Supabase Auth
- Profile mit Benutzername und Anzeigename
- Suche nach anderen Profilen über Benutzername oder Anzeigename
- Ranking-Spiele werden für angemeldete Nutzer in `ranking_games` gespeichert
- Paddle-Table-Spiel mit lokaler Spielerliste und Schuldenverwaltung
- Angular-PWA mit Service Worker und GitHub-Pages-Deployment

### Noch nicht fertig

Paddle-Table-Daten liegen noch im `localStorage` und werden nicht zwischen
Geräten synchronisiert. Beim Löschen der Browserdaten können sie verloren gehen.

- Freundschaftsanfragen können gesucht, aber noch nicht erfolgreich hinzugefügt
  bzw. vollständig verarbeitet werden.
- Benachrichtigungen, Home-Statistiken, Einstellungen und einige Profilbereiche
  verwenden noch Mock-Daten oder sind nur teilweise funktionsfähig.
- Es gibt noch keinen vollständigen Offline-Modus mit IndexedDB und
  Synchronisationswarteschlange.
- Direkte Aufrufe verschachtelter Angular-Routen müssen auf GitHub Pages noch
  getestet werden, da ein Browser-Refresh sonst zu einem 404 führen kann.

## Supabase-Datenbank

Die versionierten Migrationen liegen in `supabase/migrations/`:

- `20260918220000_core_schema.sql`: Profile, Ranking-Spiele, Freundschaften,
  RLS-Policies und automatisches Erstellen eines Profils bei Registrierung
- `20260918221000_notifications.sql`: Benachrichtigungen und RLS-Policies

Die Migrationen wurden als Grundlage für ein getrenntes Staging- und
Produktionsprojekt erstellt. Für Live sollte Entwicklung nicht dauerhaft gegen
dieselbe Datenbank wie die produktive Seite testen.

## Vor dem Livegang

- Staging- und Produktions-Supabase-Projekt trennen
- Migrationen im Produktionsprojekt ausführen und RLS prüfen
- Supabase Site URL und Redirect URLs für GitHub Pages konfigurieren
- Environment-Konfiguration im Build-System bereitstellen, da
  `environment.ts` nicht versioniert wird
- Freundschaftsanfragen und Mock-Daten durch echte Backend-Funktionen ersetzen
- Tests reparieren und den Produktionsbuild ohne kritische Warnungen prüfen
- Datenbank-Backups und eine Möglichkeit zur Kontolöschung einrichten

Die GitHub-Pages-URL ist kein Zugriffsschutz. Alles, was im Browser ausgeführt
wird, kann von Benutzern eingesehen werden. RLS und Authentifizierung müssen
deshalb im Backend durchgesetzt werden.
