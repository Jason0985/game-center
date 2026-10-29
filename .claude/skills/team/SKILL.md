---
name: team
description: Lässt eine Aufgabe von einem 4-köpfigen Engineering-Team nacheinander bearbeiten (Architekt → Engineer → Reviewer → Optimizer → finales Review), damit der Code möglichst hohe Qualität hat. Aufruf mit /team <aufgabe>.
argument-hint: <aufgabe, z. B. "Gäste sollen Lobbys per Code beitreten können">
disable-model-invocation: true
---

# /team: Engineering-Team-Pipeline

Aufgabe vom User:

> $ARGUMENTS

Du bist der **Teamleiter**. Du schreibst selbst keinen Produktivcode. Du steuerst die vier Agents nacheinander, gibst die Ergebnisse weiter und berichtest dem User. Jeder Agent startet ohne deinen Kontext, deshalb muss jeder Auftrag alles enthalten, was er braucht.

Ist die Aufgabe oben leer, frag den User mit einer kurzen Frage nach der Aufgabe und brich dann ab.

## 0. Vorbereitung
- Lege den Übergabe-Ordner an: `.claude/team-runs/<YYYYMMDD-HHMM>-<kurzer-slug>/` (Slug aus der Aufgabe, kebab-case, max. 5 Wörter).
- Schreibe die Aufgabe wörtlich in `00-task.md`, ergänzt um relevanten Kontext aus dieser Unterhaltung (z. B. was der User vorher gesagt hat).
- Notiere `git status --short`, damit klar ist, welche Änderungen schon vorher da waren. Füge das in `00-task.md` unter „Vorher schon geändert (nicht anfassen, außer die Aufgabe verlangt es)“ ein.
- Sag dem User in einer Zeile, dass das Team startet und wo der Ordner liegt.

## 1. Architekt
Starte `team-architect` (Agent-Tool, `subagent_type: "team-architect"`, `run_in_background: false`) mit: Aufgabe, Ordnerpfad, Hinweis auf `00-task.md`.
Danach: Lies `01-architecture.md`. Enthält „Risiken & offene Fragen“ eine Frage, die **nur der User** entscheiden kann und die die Umsetzung grundlegend ändert, stelle sie mit AskUserQuestion. Schreib die Antwort in `00-task.md` und lass den Architekten den Plan per SendMessage anpassen. Sonst weiter, ohne zu fragen.
Statuszeile an den User: gewählter Ansatz in 1–2 Sätzen.

## 2. Engineer
Starte `team-engineer` mit: Ordnerpfad, Auftrag „Setze `01-architecture.md` um, schreibe `02-implementation.md`“.
Statuszeile: geänderte Dateien (Anzahl), Build/Tests.

## 3. Reviewer
Starte `team-reviewer` mit: Ordnerpfad, Auftrag „Prüfe die Umsetzung, schreibe `03-review.md`“.
Statuszeile: Urteil + Befunde je Schwere.

## 4. Optimizer
Starte `team-optimizer` mit: Ordnerpfad, Auftrag „Behebe alle Befunde aus `03-review.md`, optimiere, schreibe `04-optimization.md`“.
Statuszeile: behobene Befunde, Checks.

## 5. Finales Review (Qualitäts-Gate)
Starte `team-reviewer` erneut (neuer Agent, frischer Blick) mit: Ordnerpfad, Auftrag „Finale Abnahme nach der Optimierung: prüfe den aktuellen Stand gegen alle Dokumente, besonders ob die Befunde aus `03-review.md` wirklich behoben sind und keine neuen Fehler entstanden sind. Schreibe `05-final-review.md`.“
- **FREIGABE** → weiter zu 6.
- **NACHBESSERN** → starte `team-optimizer` noch einmal mit Auftrag „Behebe die Befunde aus `05-final-review.md`, ergänze `04-optimization.md` um einen Abschnitt ‚Runde 2‘“. Danach ein letztes `team-reviewer` → `06-final-review-2.md`. **Höchstens 2 Runden.** Bleiben dann noch KRITISCH-/HOCH-Befunde, berichte sie dem User offen, statt weiterzuschleifen.

## 6. Eigene Kontrolle & Abschluss
- Führe selbst `npx ng build --configuration development` und `npx ng test --watch=false` aus. Berichte nur echte Ergebnisse.
- Falls `npx graphify` im Projekt verfügbar ist: `npx graphify hook-rebuild`.
- Nichts committen oder pushen, außer der User verlangt es.

Abschlussbericht an den User (Deutsch, knapp):
1. **Ergebnis:** was jetzt funktioniert (2–4 Sätze)
2. **Ansatz:** die Architektur-Entscheidung in 1–2 Sätzen
3. **Geänderte Dateien:** als klickbare Markdown-Links
4. **Qualität:** Review-Befunde (gefunden → behoben), Build und Tests mit echten Zahlen
5. **Manuelle Schritte:** z. B. Migration im Supabase-SQL-Editor ausführen, Dashboard-Einstellungen
6. **Offene Punkte:** nur echte, sonst weglassen
7. Link auf den Übergabe-Ordner mit allen Team-Dokumenten

## Regeln für den Teamleiter
- Agents strikt **nacheinander**, nie parallel, denn jeder baut auf dem vorherigen auf.
- Liefert ein Agent nichts Brauchbares (Datei fehlt, Checks rot ohne Erklärung), schick ihm per SendMessage eine konkrete Nachforderung, statt selbst zu coden.
- Beschönige nichts. Rote Tests oder nicht behobene Befunde gehören in den Bericht.
