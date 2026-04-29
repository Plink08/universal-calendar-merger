# Universal Google Calendar Sync (Apps Script)

This is a lightweight, reliable Google Apps Script that automatically synchronizes events from external sources (such as iCal schedule links or other Google Calendars) into a single target calendar. 

## Features
* **Universal Sources:** Supports both `.ics` (iCal) links and direct Google Calendar IDs.
* **Smart Deduplication:** Uses unique tags (`UNIQUE_TAG_KEY`) per source to prevent duplicate events in your calendar.
* **Automatic Cleanup:** Events deleted from the source are neatly removed from your target calendar.
* **Custom iCal Parser:** Includes a robust date parser specifically built to prevent timezone issues (daylight saving time) and 1970 errors.
* **Lightweight:** Searches 4 days back and 30 days ahead by default to prevent timeouts.

## How to Use

1. Go to [Google Apps Script](https://script.google.com/) and create a new project.
2. Copy the code from `sync.gs` in this project and paste it into your Apps Script editor.
3. Adjust the following two variables at the top of the script:
   ```javascript
   const SOURCE = "YOUR_ICAL_LINK_OR_SOURCE_CALENDAR_ID";
   const TARGET_CALENDAR_ID = "YOUR_TARGET_CALENDAR_ID"; // Often your email address
   ```
4. Save the script and click **Run** once to grant Google the necessary permissions (CalendarApp & UrlFetchApp).

### Automation (Triggers)
To run this script in the background:
1. Click the clock icon on the left menu (**Triggers**).
2. Add a new trigger.
3. Choose the function `syncUniversalToGCal`.
4. Select the event source: **Time-driven**.
5. Select the type of time based trigger, for example **Hourly** or **Daily**, depending on how often your schedule changes.

## Limitations
Because this script is built to be light and fast, it currently does *not* support:
* **Complex RRULEs:** iCal events with a recurrence rule (e.g., "every Monday") are only scheduled on the first date.
* **UTC Z-notations:** iCal times ending with a 'Z' (Zulu time/UTC) without a local time offset might cause time discrepancies with certain systems. 
* **Secured calendars:** iCal links requiring a login/password do not work directly via `UrlFetchApp`.
