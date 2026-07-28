# Resend-E-Mail einrichten – Schritt-für-Schritt-Anleitung für Erwin

## Worum geht es?

Käufer bekommen aktuell keine Bestätigungs-/Report-fertig-E-Mail, weil bei
Resend (dem E-Mail-Versanddienst, Entscheidung #13) noch kein Konto und
keine Domain hinterlegt sind. Der Code ist fertig (`src/lib/email/`) — es
fehlen nur die Zugangsdaten.

## Schritt 1: Konto bei Resend erstellen

1. Öffne `https://resend.com`, klicke auf "Sign up".
2. Registriere dich mit deiner E-Mail-Adresse oder über GitHub.
3. E-Mail-Adresse bestätigen.

## Schritt 2: Sendedomain hinzufügen und verifizieren

Resend darf nicht einfach unter `@tekmesis.com` senden, ohne dass du das per
DNS bestätigst (verhindert, dass Fremde in deinem Namen mailen).

1. Im Resend-Dashboard: **Domains** → **Add Domain**.
2. Domain eingeben: `tekmesis.com`.
3. Resend zeigt dir 2–3 DNS-Einträge (meist: ein TXT/SPF-Eintrag, ein oder
   zwei DKIM-CNAME-Einträge, optional ein DMARC-Eintrag).
4. Diese Einträge bei **Hostpoint** in der DNS-Zone von `tekmesis.com`
   eintragen — genau die gleiche Stelle, an der wir schon die A/CNAME-
   Einträge für die Website selbst gesetzt haben. **Wichtig:** nur
   hinzufügen, nichts Bestehendes (insbesondere eure Mail-Einträge/MX)
   löschen oder überschreiben.
5. Zurück im Resend-Dashboard auf **Verify** klicken. Kann ein paar Minuten
   bis Stunden dauern (DNS-Ausbreitung). Status wird grün ("Verified"),
   sobald es klappt.

## Schritt 3: API-Schlüssel erstellen

1. Im Resend-Menü: **API Keys** → **Create API Key**.
2. Name z. B. `tekmesis-production`.
3. Berechtigung: "Sending access" reicht (kein Domain-Management nötig).
4. Der Schlüssel wird **einmalig** angezeigt (beginnt meist mit `re_...`).
   Sofort sicher kopieren/speichern — er lässt sich danach nicht mehr
   anzeigen, nur ersetzen.
5. Niemals im Klartext per Mail/Chat verschicken oder in ein Dokument im
   Repository einfügen (CLAUDE.md: "no secrets in client or repository").

## Schritt 4: Werte bei Vercel hinterlegen

1. Vercel → Projekt "tekmesis" → **Settings** → **Environment Variables**.
2. Neue Variable:
   - **Name:** `EMAIL_API_KEY`
   - **Wert:** der kopierte `re_...`-Schlüssel
   - **Bereich:** "Production" (optional zusätzlich "Preview")
3. Zweite neue Variable:
   - **Name:** `EMAIL_FROM`
   - **Wert:** `TEKMESIS <no-reply@tekmesis.com>` (Absendername + Adresse;
     die Adresse muss zur verifizierten Domain aus Schritt 2 passen, sonst
     lehnt Resend den Versand ab)
   - **Bereich:** "Production" (optional zusätzlich "Preview")
4. Speichern, dann **Deployments** → letztes Deployment → **Redeploy**.

## Was passiert danach?

Sobald beide Werte gesetzt und die Domain verifiziert ist, sendet die App
automatisch:
- Bestätigungsmail, sobald ein Report fertig ist (`generateReportContent`
  → `sendEmail`)
- Fehlermail, falls die Report-Erstellung scheitert

Kein zusätzlicher Code nötig — die Versandlogik existiert bereits und prüft
nur, ob `EMAIL_FROM` gesetzt ist (`src/lib/email/send.ts`); ohne echten
Client wirft `getEmailClient()` einen kontrollierten Fehler statt zu
crashen.

## Zum Testen

Am einfachsten: eine neue Testfrage im Stripe-Testmodus durchkaufen
(gleicher Ablauf wie beim ersten Stripe-Test) und prüfen, ob die
Bestätigungsmail in deinem Postfach ankommt. Alternativ: im Resend-
Dashboard unter **Logs** nachsehen, ob überhaupt ein Versandversuch
ankam (zeigt auch Fehlermeldungen wie "domain not verified").

## Falls der Schlüssel je versehentlich weitergegeben wird

Resend-Dashboard → API Keys → betroffenen Schlüssel löschen → neuen
erstellen → in Vercel ersetzen → erneut redeployen.
