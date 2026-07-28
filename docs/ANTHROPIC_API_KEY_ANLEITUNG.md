# Anthropic-API-Schlüssel einrichten – Schritt-für-Schritt-Anleitung für Erwin

## Worum geht es?

Im bezahlten TEKMESIS-Report zeigen einige Abschnitte aktuell "Noch nicht
verfügbar" — die Kernaussagen, die Studien-Synthese und die praktische
Einordnung. Diese Teile erfordern eine echte KI (Claude von Anthropic), die
noch nicht angebunden ist.

Um das zu ändern, braucht es zwei getrennte Schritte:

1. **Einen Zugang bei Anthropic mit einem "API-Schlüssel" einrichten** —
   das kannst du selbst erledigen, ohne Programmierkenntnisse. Diese
   Anleitung zeigt genau wie.
2. **Den Schlüssel tatsächlich im Programmcode nutzen** (die KI-Anbindung
   für Kernaussagen/Synthese bauen) — das ist eine separate
   Programmier-Aufgabe für eine Coding-Sitzung, nicht Teil dieser
   Anleitung. Das Hinterlegen des Schlüssels allein verändert die Website
   noch nicht sichtbar.

## Was ist ein "API-Schlüssel"?

Ein API-Schlüssel ist wie ein persönliches Passwort, das nicht du selbst
eingibst, sondern das im Hintergrund von der TEKMESIS-Software genutzt
wird, um automatisiert Anfragen an Anthropics KI zu schicken. Jede Anfrage
kostet einen kleinen Geldbetrag (ähnlich wie Telefonminuten), der über eine
bei Anthropic hinterlegte Zahlungsmethode abgerechnet wird.

## Schritt 1: Konto bei Anthropic erstellen

1. Öffne im Browser: `https://console.anthropic.com`
2. Klicke auf "Sign up" (registrieren).
3. Registriere dich mit deiner E-Mail-Adresse (z. B. `erwin.fries@gmx.ch`)
   oder über ein Google-Konto.
4. Bestätige deine E-Mail-Adresse über den Link, den du per Mail
   bekommst.

*(Hinweis: Menüpunkte/Bezeichnungen in der Anthropic-Konsole können sich
mit der Zeit leicht ändern — der grundsätzliche Ablauf Registrierung →
Zahlungsmethode → Schlüssel erstellen bleibt aber gleich.)*

## Schritt 2: Zahlungsmethode hinterlegen

1. Nach dem Einloggen im Menü "Billing" bzw. "Plans & Billing" öffnen.
2. Kreditkarte hinterlegen.
3. **Empfehlung:** Ein Ausgabenlimit ("Usage limit" / "Spend limit")
   setzen, z. B. CHF 50 pro Monat zum Start. Das verhindert eine böse
   Überraschung, falls beim Testen mehr Anfragen laufen als gedacht.
   - Zur Einordnung: Die bisherige Kostenschätzung im Projekt liegt bei
     CHF 1.00–1.50 pro erstelltem Report (Entscheidung #9,
     `DECISIONS_LOG.md`). Selbst bei sehr aktiver Nutzung durch die
     15-Personen-Beta wären das nur wenige Franken pro Monat.

## Schritt 3: API-Schlüssel erstellen

1. Im Menü auf "API Keys" klicken.
2. "Create Key" klicken.
3. Einen Namen vergeben, z. B. `tekmesis-production`.
4. Der Schlüssel wird dir **einmalig** angezeigt — eine lange
   Zeichenfolge, meist beginnend mit `sk-ant-...`. Kopiere ihn sofort und
   speichere ihn an einem sicheren Ort (z. B. Passwort-Manager). Er lässt
   sich danach nicht mehr anzeigen, nur durch einen neuen ersetzen.
5. **Wichtig:** Diesen Schlüssel niemals per E-Mail, Chat-Nachricht oder in
   einem Dokument im Klartext herumschicken oder irgendwo in GitHub
   hochladen. Er funktioniert wie ein Passwort für dein Konto inklusive
   deiner hinterlegten Zahlungsmethode (siehe auch `CLAUDE.md`: "no
   secrets in client or repository").

## Schritt 4: Schlüssel bei Vercel hinterlegen

1. Öffne dein Vercel-Projekt (das bereits laufende TAKEMESIS-Projekt).
2. Settings → Environment Variables.
3. Neue Variable anlegen:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Wert:** der kopierte Schlüssel aus Schritt 3
   - **Bereich:** "Production" (optional zusätzlich "Preview")
   - Falls Vercel eine Option "Sensitive" oder "Encrypt" anbietet: diese
     aktivieren.
4. Speichern.
5. **Zusätzlich `AI_EXTRACTION_ENABLED` auf `true` setzen** (Bereich
   ebenfalls "Production"). **Update 2026-07-28:** Die KI-Anbindung ist
   inzwischen fertig gebaut und bereits in den echten Bezahl-Report-Ablauf
   eingebunden (`generate-report-content.ts`) — dieser Schalter aktiviert
   sie jetzt tatsächlich, nicht nur als Vorbereitung.
6. Redeploy anstossen (Deployments → letztes Deployment → "Redeploy"),
   damit die neuen Umgebungsvariablen wirksam werden.

## Was passiert danach?

Das Hinterlegen des Schlüssels allein verändert die Website noch nicht
sichtbar — es ist die Voraussetzung, nicht der letzte Schritt. Der nächste
Schritt ist eine separate Programmier-Aufgabe: Die KI-Anbindung für
Kernaussagen, Studien-Synthese und praktische Einordnung muss noch gebaut
werden (dokumentiert in `OPEN_RISKS.md`, Punkt #18).

**Modellwahl bereits entschieden (2026-07-26):** Auf deinen Wunsch hin ist
im Code bereits das günstigste aktuelle Claude-Modell (Haiku) als
Standard hinterlegt (`AI_MODEL=claude-haiku-4-5-20251001`), damit die
Kosten pro Report bei der Beta-Grösse (15 Personen) minimal bleiben —
voraussichtlich deutlich unter der ursprünglichen Schätzung von
CHF 1.00–1.50/Report. Du musst dazu nichts weiter tun; das wird bei der
KI-Anbindung automatisch verwendet, ausser du entscheidest dich später
bewusst für ein leistungsfähigeres (und teureres) Modell.

## Falls der Schlüssel je versehentlich weitergegeben wird

Console → API Keys → den betroffenen Schlüssel löschen ("Revoke") → einen
neuen erstellen → in Vercel ersetzen → erneut redeployen.
