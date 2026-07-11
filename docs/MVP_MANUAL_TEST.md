# MVP Manual Test Pass

Date: 2026-07-12

## Runtime

- `docker compose ps` shows PostgreSQL, API, and frontend running.
- `GET /api/health` returns `Healthy`.
- Frontend responds at `http://localhost:5173`.
- `GET /api/events` returns seed events from PostgreSQL.

## Scenarios Checked

### Guest

- Opened public event list through API.
- Opened published event details.
- Verified ticket data is returned.
- Download endpoint for `.ics` returns `200`.

### Participant

- Registered a new test user.
- Registered that user for a published event.
- Verified `GET /api/registrations/my` returns the registration.
- Verified duplicate registration returns a clear API error.
- Verified draft-event registration is blocked by API.
- Verified invalid ticket registration is blocked by API.
- Verified a capacity-1 ticket accepts the first registration and blocks the second registration.

### Organizer

- Registered a new organizer account.
- Created a draft event.
- Added a ticket.
- Published the event.
- Verified event details show the published state and ticket.
- Verified organizer dashboard returns the created event.

### Check-In

- Enabled registration and check-in modes for a test event.
- Registered a participant for that event.
- Loaded event registrations as organizer.
- Checked in the participant by code.
- Verified the participant status changed to `CheckedIn`.

## UX Fixes From This Pass

- Common backend API messages are mapped to Russian frontend messages.
- This avoids showing raw English errors such as duplicate registration or draft registration errors.
- Full ticket capacity now maps to a clear Russian frontend message.

## Remaining Test Gap

- Registration guard scenarios are manually checked through API, but they still need automated integration tests.
