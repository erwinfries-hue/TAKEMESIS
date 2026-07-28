# Fragen an den Treuhänder — MWST/VAT-Klärung vor Stripe-Live-Schaltung

Kontext für den Treuhänder: TEKMESIS ist ein digitales Produkt der AXIA4 GROUP
(Einzelunternehmen Erwin Fries, Hofmatt 9, 6332 Hagendorn, Schweiz). Verkauft
wird ein einmaliger, digital gelieferter Evidence-Report für CHF 9.90 pro
Kauf (kein Abo, keine physische Ware, sofortiger digitaler Zugriff nach
Zahlung). Zielmarkt: DACH (Schweiz, Deutschland, Österreich), ggf. weitere
EU-Länder. Zahlungsabwicklung über Stripe. **Dies ist der letzte offene
Blocker, bevor Stripe von Testmodus auf Live-Modus umgestellt werden darf**
(`docs/OPEN_RISKS.md` #1) — bis zur Klärung bleibt das Produkt im
Testmodus, es fliesst kein echtes Geld.

Aktuell verwendete Übergangsformulierung auf der Seite (nur bis zur Klärung):
> "CHF 9.90, Einmalzahlung, keine MWST ausgewiesen (Kleinunternehmerregelung
> / Gründungsphase). Kein Abo."

---

## 1. Schweizer MWST-Pflicht

1. Löst der geplante Umsatz (CHF 9.90 × geschätzte Verkäufe, Start mit
   15-Personen-Closed-Beta, danach offen) eine MWST-Registrierungspflicht
   aus, oder bleibt AXIA4 GROUP vorerst unter der CHF-100'000-Schwelle?
2. Ist die aktuelle Formulierung **"Kleinunternehmerregelung"** überhaupt
   der korrekte Begriff für ein Schweizer Einzelunternehmen? (Das ist
   eigentlich ein deutscher/österreichischer MWST-Begriff — vermutlich muss
   die Schweizer Seite anders formuliert werden, z. B. schlicht "nicht
   MWST-pflichtig" mit Verweis auf die Umsatzschwelle.) **Bitte konkrete,
   rechtssichere deutsche und englische Formulierung vorschlagen**, die wir
   1:1 auf der Seite übernehmen können.
3. Braucht die Rechnung/Zahlungsbestätigung trotzdem eine
   Handelsregister-/UID-Nummer, auch ohne MWST-Pflicht?

## 2. EU-grenzüberschreitende Digitalsteuer (Deutschland/Österreich-Kunden)

4. Gilt für digital erbrachte Leistungen an EU-Konsumenten (B2C) aus einem
   Nicht-EU-Land (Schweiz) das Bestimmungslandprinzip — d. h. muss ab dem
   **ersten** Verkauf an einen deutschen/österreichischen Kunden lokale
   EU-Mehrwertsteuer abgeführt werden, unabhängig vom Umsatzvolumen? (Uns
   ist bekannt, dass die 10'000-EUR-Bagatellgrenze nur für in der EU
   ansässige Anbieter gilt, nicht für Schweizer Anbieter — bitte bestätigen
   oder korrigieren.)
5. Ist eine Registrierung im **EU-"Non-Union-OSS"-Verfahren** (One-Stop-Shop
   für digitale Dienstleistungen von Drittlandsanbietern) der richtige,
   praktikable Weg, um das in einem einzigen EU-Mitgliedstaat zentral
   abzuwickeln, statt sich in jedem einzelnen Land zu registrieren?
   - Falls ja: in welchem Land würden Sie die Registrierung empfehlen, und
     welche Unterlagen/Schritte brauchen Sie von uns?
   - Realistischer Zeitrahmen bis zur Betriebsbereitschaft?
6. Was ist die einfachste **Übergangslösung**, falls die OSS-Registrierung
   noch nicht rechtzeitig steht, wir aber schon in der Closed Beta reale
   Zahlungen von deutschen/österreichischen Testnutzern zulassen wollen?
   Optionen zur Diskussion:
   - Beta zunächst nur für Schweizer Kunden freischalten, EU-Kunden erst
     nach OSS-Registrierung.
   - Stripe Tax (siehe Punkt 8) automatisch abführen lassen, falls das
     rechtlich für die Übergangszeit ausreicht.

## 3. Stripe Tax

7. Kennen Sie **Stripe Tax** (Stripes eingebaute Funktion zur automatischen
   Steuerberechnung/-abführung pro Land)? Reicht die Aktivierung dieser
   Funktion aus, um die unter Punkt 4/5 genannten Pflichten technisch
   korrekt zu erfüllen, oder ersetzt das nicht die eigentliche Registrierung
   beim jeweiligen Steuerbehörden-/OSS-System?
8. Falls empfohlen: Soll Stripe Tax von Anfang an aktiviert werden (auch
   während der Schweiz-only-Beta), damit später beim EU-Rollout nichts
   nachträglich umgestellt werden muss?

## 4. Einkommenssteuer / Buchhaltung (praktisch, nicht MWST)

9. Reicht für die laufende Buchhaltung des Einzelunternehmens ein einfacher
   monatlicher Export der Stripe-Auszahlungen (Bruttoumsatz, Stripe-Gebühren,
   Nettoauszahlung), oder brauchen Sie ein bestimmtes Format/Tool
   (z. B. Bexio, Banana, Excel-Vorlage)?
10. Gibt es steuerlich etwas zu beachten bei den **manuellen Rückerstattungen**
    (Refunds), die im Admin-Bereich möglich sind — insbesondere wenn ein
    Refund in einem anderen Steuerjahr/Quartal erfolgt als der ursprüngliche
    Verkauf?

## 5. Angrenzend, aber vermutlich eher ein Rechtsanwalts- als
   Treuhänder-Thema — bitte trotzdem kurz einordnen, wen wir dafür brauchen

11. **EU-Widerrufsrecht bei digitalen Inhalten:** Nach EU-Verbraucherrecht
    haben Konsumenten normalerweise 14 Tage Widerrufsrecht — bei sofort
    gelieferten digitalen Inhalten kann das nur entfallen, wenn der Kunde
    vor Kaufabschluss **ausdrücklich zustimmt** und bestätigt, dass er auf
    das Widerrufsrecht verzichtet, weil die Lieferung sofort erfolgt. Aktuell
    hat unser Checkout **keine** solche Zustimmungs-Checkbox. Ist das für
    Sie Teil der MWST-/OSS-Beratung, oder brauchen wir dafür separat einen
    Anwalt? Falls Sie es einordnen können: ist das ein Blocker für den
    EU-Verkaufsstart, so wie die VAT-Frage selbst?
12. Reicht unser aktuelles `/legal`-Impressum (Firma, Adresse, Kontakt,
    Land) für einen EU-Verkaufsstart, oder fehlen dort Pflichtangaben
    (z. B. Streitschlichtungs-Plattform-Link, den die EU für
    Online-Verkäufer vorschreibt)?

---

## Was wir von Ihnen als Ergebnis brauchen

Damit wir das direkt umsetzen können, im Idealfall pro offenem Punkt:
- **Ja/Nein bzw. konkreter Schwellenwert/Zeitpunkt**
- **Exakter Rechtstext-Vorschlag** für `/legal` und den Preishinweis (DE
  und EN), falls sich die aktuelle Formulierung ändern muss
- **Eine geordnete Schritt-Liste**, was vor der Stripe-Live-Schaltung noch
  passieren muss (Registrierung, Stripe-Tax-Aktivierung, ggf. Anwalt für
  Punkt 11/12)

Sobald das vorliegt, setzen wir die Textänderungen und ggf. den
Checkout-Consent-Schritt um und schalten Stripe erst danach live — bis
dahin bleibt alles im Testmodus (`STRIPE_MODE=test`), es kann also nichts
vorzeitig live gehen.
