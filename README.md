# Universal Google Calendar Sync (Apps Script)

Dit is een lichtgewicht, betrouwbaar Google Apps Script dat automatisch afspraken vanuit externe bronnen (zoals iCal-links van roosters of andere Google Agenda's) synchroniseert naar één doel-agenda. 

## Features
* **Universele Bronnen:** Ondersteunt zowel `.ics` (iCal) links als directe Google Calendar ID's.
* **Slimme Deduplicatie:** Gebruikt unieke tags (`UNIQUE_TAG_KEY`) per bron om te voorkomen dat afspraken dubbel in je agenda komen te staan.
* **Automatische Cleanup:** Afspraken die uit de bron zijn verwijderd, worden ook netjes uit je doel-agenda gehaald.
* **Custom iCal Parser:** Bevat een robuuste datum-parser die specifiek is gebouwd om problemen met tijdzones (zomer/wintertijd) en 1970-fouten te voorkomen.
* **Lichtgewicht:** Zoekt standaard 4 dagen terug en 30 dagen vooruit om timeouts te voorkomen.

## Hoe te gebruiken

1. Ga naar [Google Apps Script](https://script.google.com/) en maak een nieuw project aan.
2. Kopieer de code uit `sync.gs` in dit project en plak het in je Apps Script editor.
3. Pas de volgende twee variabelen aan bovenaan het script:
   ```javascript
   const SOURCE = "JOUW_ICAL_LINK_OF_BRON_AGENDA_ID";
   const TARGET_CALENDAR_ID = "JOUW_DOEL_AGENDA_ID"; // Vaak je e-mailadres
   ```
4. Sla het script op en klik eenmalig op **Uitvoeren** om Google de benodigde rechten (CalendarApp & UrlFetchApp) te geven.

### Automatiseren (Triggers)
Om dit script op de achtergrond te laten draaien:
1. Klik aan de linkerkant op het klokje (**Triggers**).
2. Voeg een nieuwe trigger toe.
3. Kies de functie `syncUniversalToGCal`.
4. Selecteer de gebeurtenisbron: **Tijdgestuurd**.
5. Kies bijvoorbeeld **Elk uur** of **Elke dag**, afhankelijk van hoe vaak je rooster wijzigt.

## Beperkingen
Omdat dit script is gebouwd om licht en snel te zijn, ondersteunt het momenteel *niet*:
* **Complexe RRULE's:** iCal afspraken met een herhalingsregel (bijv. "elke maandag") worden alleen op de eerste datum ingepland.
* **UTC Z-notaties:** iCal tijden die eindigen op een 'Z' (Zulu time/UTC) zonder lokale verschuiving kunnen bij bepaalde systemen tijdsverschillen opleveren. 
* **Beveiligde agenda's:** iCal links die een inlog/wachtwoord vereisen werken niet direct via `UrlFetchApp`.
