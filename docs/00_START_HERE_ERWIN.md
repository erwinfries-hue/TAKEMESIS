# TEKMESIS – Schritt-für-Schritt-Anleitung für Erwin

## 1. Domain

Registriere `tekmesis.com` bei Hostpoint.

Empfohlene E-Mail-Adressen:
- `info@tekmesis.com`
- `support@tekmesis.com`
- `privacy@tekmesis.com`

Die Domain und E-Mail bleiben bei Hostpoint. Später werden nur die Website-DNS-Einträge auf Vercel gesetzt.

## 2. GitHub

Erstelle ein privates Repository:

`tekmesis-mvp`

Lade den vollständigen Inhalt dieses Pakets hoch.

## 3. Claude Code

Öffne das Repository mit Claude Code.

Kopiere den vollständigen Inhalt von:

`01_MASTER_PROMPT_FOR_CLAUDE_CODE.md`

in Claude Code.

## 4. Zuerst Konzeptprüfung

Claude darf nicht sofort programmieren.

Claude muss:
1. alle Dokumente und Assets lesen,
2. das Konzept tiefgehend prüfen,
3. Widersprüche und Risiken identifizieren,
4. Verbesserungsvorschläge machen,
5. genau eine Frage pro Nachricht stellen,
6. jede Entscheidung dokumentieren,
7. am Ende deine ausdrückliche Freigabe einholen.

## 5. Was du besonders prüfen solltest

- breite Themenpositionierung statt Gesundheitsfokus
- Zielgruppe
- welche Themen im Beta-Start zugelassen sind
- Grenzen der wissenschaftlichen Datenquellen
- kostenloser Teaser
- Tiefe des Premium Reports
- Preis CHF 9.90
- Aufbewahrung bezahlter Reports
- Support und Rückerstattung
- Datenschutz
- Beta-Umfang
- Go-/No-Go-Kriterien

## 6. Freigabeformulierung

Nach Abschluss der Konzeptfragen:

`Konzeptentscheidungen sind freigegeben. Beginne mit der Umsetzung und arbeite selbständig bis zum nächsten echten Zugriffs-, Rechts- oder Freigabepunkt weiter.`

## 7. Konten

Voraussichtlich erforderlich:
- GitHub
- Vercel
- Stripe
- Supabase
- Anthropic API
- ein Transaktionsmail-Dienst oder eine geprüfte Hostpoint-Mail-Lösung

Optional:
- Sentry
- datenschutzfreundliche Analytics

## 8. Zugangsdaten

Keine API-Schlüssel in:
- Claude-Chat
- GitHub
- Screenshots
- Dokumentationen

Nur in:
- `.env.local`
- Vercel Environment Variables
- Supabase Secrets

## 9. Stripe

Zuerst ausschließlich Testmodus.

Testfälle:
- erfolgreiche Zahlung
- Abbruch
- fehlerhafte Signatur
- doppelter Webhook
- keine Freischaltung allein durch Rückleitung
- Reporterstellung erfolgreich
- Reporterstellung fehlgeschlagen
- manueller Refund
- E-Mail und sicherer Report-Link

## 10. Preview

Vor dem Go-live vollständig auf Vercel Preview testen:
- Themenauswahl
- Frageeingabe
- Fragepräzisierung
- Datenquellenrouting
- Eignungsprüfung
- Teaser
- Stripe
- Premium Report
- Quellenlinks
- Admin
- E-Mail
- Deutsch/Englisch
- Smartphone/Desktop
- sensible oder ungeeignete Fragen

## 11. Go-live

- `tekmesis.com` in Vercel hinzufügen
- exakte DNS-Werte von Vercel bei Hostpoint setzen
- Hostpoint-Mailrecords unverändert erhalten
- SSL prüfen
- Stripe Live konfigurieren
- eine reale Zahlung testen
- unabhängige Schlussprüfung durchführen

## 12. AXIA4

Auf `axia4.ch/digital` wird nur eine kurze TEKMESIS-Vorstellung mit Link auf `https://tekmesis.com` ergänzt.

Keine Reverse-Proxy- oder Unterpfad-Architektur.
