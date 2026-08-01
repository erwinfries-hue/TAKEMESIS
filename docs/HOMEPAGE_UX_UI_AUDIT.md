# Homepage UX/UI Audit (2026-08-01)

Prepared in response to an external optimization proposal for the homepage,
hero, CTA hierarchy, and question input. Every finding below is grounded in
the actual code (`src/app/page.tsx` and the components it renders) as of
commit `a54ec7e`, not a general best-practices checklist — items I could not
verify from this sandbox (no live network access to `tekmesis.com`, no
browser rendering) are marked explicitly as **unverified, needs a human
check**.

## Funktion

| Frage | Befund |
|---|---|
| Funktioniert die Frageeingabe? | Ja — `OwnQuestionForm` ist ein Client-Component-Formular, `action="/search" method="get"`, überträgt `q` als Query-Parameter. |
| Funktioniert die Weiterleitung in den Suchprozess? | Ja — volle Seitennavigation zu `/search`, mit eigenem `loading.tsx` (Spinner) während der Suche läuft. |
| Werden vorausgefüllte Beispielfragen korrekt übernommen? | Ja — `OwnQuestionForm` liest `?q=` aus der URL als `initialValue` und remounted bei Änderung (siehe Kommentar im Code zu genau diesem Zweck). |
| Funktionieren Sprachwechsel und Navigation? | Sprachwechsel ist Cookie-basiert (`tekmesis_locale`), keine URL-Pfade pro Sprache — funktioniert, aber siehe SEO-Anmerkung unten. |
| Funktionieren Links zum Beispielreport? | Ja, `/example-report` ist eine eigene Seite mit explizitem Platzhalter-Hinweis (Status-Badge + Body-Text + previewNote). |
| Funktioniert die DOI-/Studienfunktion? | Ja — `StudyLookupForm`, eigenständiges GET-Formular zu `/search?doi=...`. |
| Bleiben Eingaben bei Navigation oder Fehlern erhalten? | Ja — `/search` rendert `{question}` zurück, auch im Block/Fehlerfall (verifiziert in `search/page.tsx`). |
| Funktioniert die Seite auf Mobile, Tablet, Desktop? | **Unverifiziert (kein Browser-Zugriff aus dieser Sandbox)** — strukturell responsive (Tailwind `sm:`-Breakpoints durchgehend), aber kein visueller Test möglich. |
| Unnötige Ladezeiten/Layoutverschiebungen? | Keine offensichtlichen im Code (keine ungebundenen Bilder ohne Dimension, Fonts über `next/font`). Lighthouse-Messung nicht möglich aus dieser Sandbox. |

## UX

| Frage | Befund |
|---|---|
| In 5 Sekunden verständlich, was TEKMESIS macht? | H1 + Claim direkt im ersten Bildschirmbereich, unverändert seit heutiger Hero-Anpassung. |
| Eindeutig, welche Handlung zuerst? | **Teilweise.** `OwnQuestionForm` und `StudyLookupForm` stehen als zwei **gleichwertige** Karten nebeneinander (`lg:flex-row`) — die primäre Handlung (eigene Frage) konkurriert visuell mit der sekundären (DOI-Lookup). Das deckt sich mit Abschnitt 8 des externen Vorschlags. |
| Sichtbar, dass die erste Prüfung kostenlos ist? | Ja, im "Kostenlos vs. Premium"-Abschnitt weiter unten — aber **nicht direkt am CTA selbst**, kein Hinweistext unmittelbar unter dem Haupt-CTA. |
| Sichtbar, wann/wofür CHF 9.90 bezahlt wird? | Ja, aber erst in Abschnitt 6 der Seite (Kostenlos-vs-Premium), nicht im Hero. |
| Zu viele gleichwertige CTAs? | Ja — siehe oben: zwei nebeneinanderstehende Formulare ohne visuelle Hierarchie zwischen ihnen. |
| DOI-Funktion für Erstnutzer zu prominent? | Ja, gleiche Kartengrösse/-gewicht wie die Haupteingabe. |
| Beispielreport als Qualitätsnachweis gut eingebunden? | Teilweise — Link existiert in Sektion 4 der Homepage, aber kein visueller Vorgeschmack (Screenshot/Ausschnitt) direkt im Hero. |
| Beta-Kommunikation vertrauensbildend? | Ja — der reine Beta-Satz im Hero wurde heute entfernt (Redundanz mit Trust-Sektion), verbleibende Beta-Kommunikation sitzt jetzt konzentriert am Seitenende. |

## UI

| Frage | Befund |
|---|---|
| Primärer CTA sofort erkennbar? | Ja, `bg-brand-navy-900`, einzige dunkel gefüllte Fläche im Hero. |
| Konsistente Marke (Navy/Teal/Weiss/AXIA4-Gold)? | Ja, durchgehend Tailwind-Tokens `brand-navy-*`/`brand-teal-*`/`brand-neutral-*`, kein Hardcoded-Hex im Homepage-Code gefunden. |
| Hero zu textlastig? | Nein mehr — nach der heutigen Verdichtung (7→4 "So funktioniert's"-Schritte, entfernter Beta-Satz) ist der Hero kompakter als noch heute Vormittag. |
| Mobile visuell ruhig genug? | **Unverifiziert visuell**, aber strukturell verbessert: Abstände heute von `py-16` auf `py-10` (mobil) reduziert. |

## Zusätzliche, im Code gefundene Lücken (nicht im externen Vorschlag erwähnt)

- **Enter sendet die Frage nicht ab.** `OwnQuestionForm`s Eingabefeld ist ein `<textarea>` — Enter erzeugt dort standardmässig einen Zeilenumbruch, kein Submit. Der externe Vorschlag verlangt "Enter darf die Frage absenden", was bei einem mehrzeiligen Feld möglicherweise nicht gewünscht ist (Nutzer könnte längere Fragen mit Umbrüchen tippen wollen) — empfehle **Cmd/Ctrl+Enter** als Kompromiss statt reinem Enter.
- **Kein sichtbares Zeichenlimit.** `maxLength={MAX_QUESTION_LENGTH}` ist gesetzt, aber es gibt keine Anzeige ("120/500 Zeichen") — der Nutzer merkt das Limit erst, wenn er nicht mehr weitertippen kann.
- **Kein `aria-live` während der Suche.** `/search/loading.tsx` zeigt einen Spinner, aber ohne `aria-live`-Region wird ein Screenreader-Nutzer über den Ladezustand nicht informiert.
- **`/admin`, `/checkout`, `/report/[token]`, `/search` hatten kein `noindex`** — bereits behoben (siehe Commit `a54ec7e`, gleichzeitig mit `sitemap.xml`/`robots.txt`).

## Nicht überprüfbar aus dieser Sandbox

- Visuelles Rendering auf echten Mobile-/Tablet-/Desktop-Viewports
- Lighthouse-Score / echte Ladezeiten
- Tatsächliches Klickverhalten / Cumulative Layout Shift live gemessen

Diese Punkte sollten von Erwin direkt auf `tekmesis.com` gegengeprüft werden,
da diese Sandbox keinen Netzwerkzugriff auf die Produktivseite hat.
