function syncUniversalToGCal() {
  // 1. VUL HIER JE BRON EN DOEL IN
  // Bron kan een iCal-link (https://...) OF een Google Agenda ID (...@group.calendar.google.com) zijn.
   const SOURCE = "JOUW_ICAL_LINK_OF_BRON_AGENDA_ID";
   const TARGET_CALENDAR_ID = "JOUW_DOEL_AGENDA_ID"; // Vaak je e-mailadres

  // 2. AUTOMATISCHE DETECTIE & TAG GENERATIE
  const isICal = SOURCE.toLowerCase().startsWith("http");
  let tagBase = isICal ? SOURCE.split("/").pop().split("?")[0] : SOURCE.split("@")[0];
  const UNIQUE_TAG_KEY = "sync_" + tagBase.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_");

  const targetCal = CalendarApp.getCalendarById(TARGET_CALENDAR_ID);
  if (!targetCal) throw new Error("Doelagenda niet gevonden.");

  // 3. ZOEKBEREIK 
  const startSearch = new Date();
  startSearch.setDate(startSearch.getDate() - 21);
  const endSearch = new Date();
  endSearch.setDate(new Date().getDate() + 28); 

  // 4. BESTAANDE AFSPRAKEN IN KAART BRENGEN
  const targetEvents = targetCal.getEvents(startSearch, endSearch);
  const targetMap = {};
  targetEvents.forEach(ev => {
    const sourceId = ev.getTag(UNIQUE_TAG_KEY); 
    if (sourceId) { targetMap[sourceId] = ev; }
  });

  // 5. DATA OPHALEN
  let sourceEventsData = [];

  if (isICal) {
    const response = UrlFetchApp.fetch(SOURCE);
    const vevents = response.getContentText().split("BEGIN:VEVENT");
    
    vevents.forEach(e => {
      if (!e.includes("SUMMARY")) return;
      const uidMatch = e.match(/UID:([^\r\n]+)/);
      const dtStartMatch = e.match(/DTSTART.*:(.*)/);
      const dtEndMatch = e.match(/DTEND.*:(.*)/);
      if (!uidMatch || !dtStartMatch || !dtEndMatch) return;

      const summaryMatch = e.match(/SUMMARY:([^\r\n]+)/);
      const locationMatch = e.match(/LOCATION:([^\r\n]+)/);
      const descMatch = e.match(/DESCRIPTION:([^\r\n]+)/);

      sourceEventsData.push({
        id: uidMatch[1].trim(),
        title: summaryMatch ? summaryMatch[1].trim() : "Geen titel",
        start: parseICalDate(dtStartMatch[1].trim()),
        end: parseICalDate(dtEndMatch[1].trim()),
        location: locationMatch ? locationMatch[1].trim() : "",
        description: descMatch ? descMatch[1].trim().replace(/\\n/g, "\n") : ""
      });
    });
  } else {
    const sourceCal = CalendarApp.getCalendarById(SOURCE);
    if (!sourceCal) throw new Error("Bronagenda niet gevonden.");
    sourceCal.getEvents(startSearch, endSearch).forEach(ev => {
      sourceEventsData.push({
        id: ev.getId(), title: ev.getTitle(), start: ev.getStartTime(), end: ev.getEndTime(),
        location: ev.getLocation() || "", description: ev.getDescription() || ""
      });
    });
  }

  // 6. SYNCEN
  sourceEventsData.forEach(data => {
    if (isNaN(data.start.getTime())) return;
    if (targetMap[data.id]) {
      const existing = targetMap[data.id];
      existing.setTitle(data.title);
      existing.setTime(data.start, data.end);
      existing.setLocation(data.location);
      existing.setDescription(data.description);
      delete targetMap[data.id]; 
      Logger.log("Geupdate: " + data.title + " " + data.start.getDate() + "-" + (data.start.getMonth() + 1) + "-" + data.start.getFullYear() + " om " + data.start.getHours() + ":" + (data.start.getMinutes()<10?'0':'') + data.start.getMinutes());
    } else {
      const newEvent = targetCal.createEvent(data.title, data.start, data.end, {
        location: data.location, description: data.description
      });
      newEvent.setTag(UNIQUE_TAG_KEY, data.id); 
      Logger.log("Nieuw: " + data.title);
    }
  });

  // 7. OPRUIMEN
  for (const id in targetMap) {
    targetMap[id].deleteEvent();
    Logger.log("Verwijderd: " + targetMap[id].getTitle());
  }
}

// DE GEREPAREERDE PARSER (GEEN TIJDVERSCHUIVING MEER)
function parseICalDate(dateStr) {
  const match = dateStr.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2}))?/);
  if (!match) return new Date(NaN);

  const y = parseInt(match[1]);
  const m = parseInt(match[2]) - 1;
  const d = parseInt(match[3]);

  if (match[4]) { // Er is een tijd (T...)
    const hh = parseInt(match[5]);
    const mm = parseInt(match[6]);
    const ss = parseInt(match[7]);
    // Maakt een datum object in de lokale tijd van de script-instellingen
    return new Date(y, m, d, hh, mm, ss);
  }
  return new Date(y, m, d); // Hele dag
}
