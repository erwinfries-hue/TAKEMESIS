# Homepage Layout Decision (2026-08-01)

## Varianten-Bewertung

Der externe Vorschlag stellt drei Hero-Varianten zur Wahl:

- **Variante A — Question First**: zweispaltig, Frage-Eingabe links, Produktvorschau (Teaser/Report-Ausschnitt) rechts.
- **Variante B — Guided Choice**: erst eine Modus-Auswahl ("Ich habe eine Frage" / "Ich habe eine Studie"), dann das passende Feld.
- **Variante C — Evidence Experience**: Frage links, visuelle Prozessdarstellung (Frage → Studienvergleich → Einordnung) rechts.

**Entscheidung: Variante A ("Question First"), in Elementen mit Variante B kombiniert.**

Begründung:
- Der heutige Audit (`docs/HOMEPAGE_UX_UI_AUDIT.md`) bestätigt das Kernproblem, das Variante A und B beide adressieren: `OwnQuestionForm` und `StudyLookupForm` stehen aktuell als **zwei gleichwertige Karten** nebeneinander — keine klare primäre Handlung.
- Variante C (Prozessdarstellung statt Produktvorschau) würde die bereits vorhandene `LiveDemoPreview`-Komponente (echte Teaser-Daten, kein erfundener Prozess-Diagramm) verwerfen — unnötiger Verlust eines funktionierenden, datengestützten Elements.
- Aus Variante B übernehme ich das Grundprinzip (DOI-Lookup nicht mehr gleichwertig, sondern untergeordnet) — aber als **Tabs/Segmented Control direkt am bestehenden Formular-Ort**, nicht als komplett neue Vorschaltseite. Das behebt das Problem mit deutlich kleinerem Eingriff.

## Umsetzungsentscheidung: gestuft, nicht als ein grosser Umbau

Diese Session läuft ohne Live-Browser-Zugriff (bestätigte Sandbox-Einschränkung,
siehe frühere Diskussionen) und ohne Erwin in Echtzeit erreichbar (er hat für
diese Runde "so viel wie möglich selbstständig" beauftragt). Ein kompletter
Zweispalten-Hero-Umbau mit neuer Produktvorschau-Spalte ist die riskanteste,
am wenigsten inkrementell überprüfbare Änderung im gesamten Vorschlag — sie
betrifft eine live geschaltete, zahlende Anwendung.

**Umgesetzt in dieser Runde** (kontrolliert, einzeln testbar, alle mit
Lint/Typecheck/Tests/Build verifiziert):
1. DOI-Lookup als sekundärer Tab statt gleichwertige Karte (behebt den
   Hauptbefund direkt, kleinster Eingriff mit grösster Wirkung)
2. Zeichenlimit sichtbar anzeigen
3. Cmd/Ctrl+Enter sendet die Frage ab (nicht reines Enter — das bliebe
   Zeilenumbruch, siehe Audit-Begründung)
4. Vertrauenszeile mit Icons direkt unter dem CTA
5. Sticky mobiler CTA

**Bewusst zurückgestellt, nicht umgesetzt:** die vollständige
Zweispalten-Hero-Struktur mit separater Produktvorschau-Spalte (der
visuell aufwendigste Teil von Variante A). Empfehlung: mit Erwin gemeinsam
im Browser umsetzen, wie es beim heutigen Hero-Reorder und den
Mobile-Abstands-Anpassungen bereits erfolgreich gehandhabt wurde (Änderung
vorschlagen, deployen, gemeinsam per Screenshot gegenprüfen) — nicht blind
in einer Runde ohne visuelle Rückmeldung.
