function syncUniversalToGCal() {
  // 1. SET YOUR SOURCE AND TARGET HERE
  // Source can be an iCal link (https://...) OR a Google Calendar ID (...@group.calendar.google.com).
  const SOURCE = "YOUR_ICAL_LINK_OR_SOURCE_CALENDAR_ID";
  const TARGET_CALENDAR_ID = "YOUR_TARGET_CALENDAR_ID"; // Often your email address

  // 2. AUTOMATIC DETECTION & TAG GENERATION
  const isICal = SOURCE.toLowerCase().startsWith("http");
  let tagBase = isICal ? SOURCE.split("/").pop().split("?")[0] : SOURCE.split("@")[0];
  const UNIQUE_TAG_KEY = "sync_" + tagBase.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "_");

  const targetCal = CalendarApp.getCalendarById(TARGET_CALENDAR_ID);
  if (!targetCal) throw new Error("Target calendar not found. Check the TARGET_CALENDAR_ID.");

  // 3. SEARCH RANGE
  // Default: 21 days back, 28 days ahead
  const startSearch = new Date();
  startSearch.setDate(startSearch.getDate() - 21);
  const endSearch = new Date();
  endSearch.setDate(new Date().getDate() + 28); 

  // 4. MAP EXISTING EVENTS
  const targetEvents = targetCal.getEvents(startSearch, endSearch);
  const targetMap = {};
  targetEvents.forEach(ev => {
    const sourceId = ev.getTag(UNIQUE_TAG_KEY); 
    if (sourceId) { targetMap[sourceId] = ev; }
  });

  // 5. FETCH DATA
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
        title: summaryMatch ? summaryMatch[1].trim() : "No title",
        start: parseICalDate(dtStartMatch[1].trim()),
        end: parseICalDate(dtEndMatch[1].trim()),
        location: locationMatch ? locationMatch[1].trim() : "",
        description: descMatch ? descMatch[1].trim().replace(/\\n/g, "\n") : ""
      });
    });
  } else {
    const sourceCal = CalendarApp.getCalendarById(SOURCE);
    if (!sourceCal) throw new Error("Source calendar not found. Check the SOURCE ID.");
    sourceCal.getEvents(startSearch, endSearch).forEach(ev => {
      sourceEventsData.push({
        id: ev.getId(), title: ev.getTitle(), start: ev.getStartTime(), end: ev.getEndTime(),
        location: ev.getLocation() || "", description: ev.getDescription() || ""
      });
    });
  }

  // 6. SYNC EVENTS
  sourceEventsData.forEach(data => {
    if (isNaN(data.start.getTime())) return;
    if (targetMap[data.id]) {
      const existing = targetMap[data.id];
      existing.setTitle(data.title);
      existing.setTime(data.start, data.end);
      existing.setLocation(data.location);
      existing.setDescription(data.description);
      delete targetMap[data.id]; 
      Logger.log("Updated: " + data.title + " on " + data.start.getDate() + "-" + (data.start.getMonth() + 1) + "-" + data.start.getFullYear() + " at " + data.start.getHours() + ":" + (data.start.getMinutes()<10?'0':'') + data.start.getMinutes());
    } else {
      const newEvent = targetCal.createEvent(data.title, data.start, data.end, {
        location: data.location, description: data.description
      });
      newEvent.setTag(UNIQUE_TAG_KEY, data.id); 
      Logger.log("New: " + data.title);
    }
  });

  // 7. CLEANUP
  for (const id in targetMap) {
    targetMap[id].deleteEvent();
    Logger.log("Deleted: " + targetMap[id].getTitle());
  }
}

// THE FIXED PARSER (NO TIMEZONE SHIFT)
function parseICalDate(dateStr) {
  const match = dateStr.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2}))?/);
  if (!match) return new Date(NaN);

  const y = parseInt(match[1]);
  const m = parseInt(match[2]) - 1;
  const d = parseInt(match[3]);

  if (match[4]) { // There is a time component (T...)
    const hh = parseInt(match[5]);
    const mm = parseInt(match[6]);
    const ss = parseInt(match[7]);
    // Creates a Date object in the local time of the script settings
    return new Date(y, m, d, hh, mm, ss);
  }
  return new Date(y, m, d); // All-day event
}
