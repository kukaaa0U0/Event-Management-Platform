# Roadmap

This roadmap keeps the project direction clear across sessions.

## Current State

Completed:

- Clean Architecture solution with `Domain`, `Application`, `Infrastructure`, and `API`.
- Core domain entities, value objects, and enums.
- ASP.NET Core Web API with controllers.
- Swagger UI.
- PostgreSQL infrastructure with EF Core.
- Initial EF Core migration.
- Docker Compose foundation for PostgreSQL and API.
- `GET /api/health`.
- `GET /api/events` wired to database read service.
- `GET /api/events/my` returns events managed by the current organizer/admin.
- `GET /api/events/dashboard` returns organizer dashboard statistics.
- `GET /api/events/{id}` wired to database read service with ticket details.
- `GET /api/events/{id}/calendar.ics` downloads an iCalendar file for an event.
- `GET /api/categories`.
- `POST /api/events` creates draft events in PostgreSQL.
- `PUT /api/events/{id}` updates organizer-owned event details.
- `POST /api/events/{id}/tickets` creates ticket types for organizer-owned events.
- `POST /api/events/{id}/publish`.
- `POST /api/events/{id}/cancel`.
- `POST /api/events/{eventId}/registrations` creates participant registrations.
- `GET /api/events/{eventId}/registrations` lists participants for an event.
- `GET /api/registrations/my` lists registrations for the current authenticated user.
- `POST /api/check-in` marks participants as checked in by check-in code.
- `POST /api/auth/register` creates an account and returns a JWT access token.
- `POST /api/auth/login` validates credentials and returns a JWT access token.
- JWT bearer validation is configured in the API.
- Event creation and event mutation endpoints require JWT.
- Event registration list and check-in require organizer/admin access.
- Event ownership checks use `Event.OrganizerId`.
- Seed data for initial events, categories, organizer, and tickets.
- Users can store nullable `password_hash` for account login without breaking participant-only users.
- React/Vite frontend foundation.
- Frontend event list and event details screen connected to API.
- Frontend registration form connected to `POST /api/events/{eventId}/registrations`.
- Frontend registration form uses the logged-in account when JWT is available.
- Frontend shows "My registrations" for the logged-in account.
- Frontend "My registrations" panel is extracted from `App.tsx`.
- Frontend shows generated check-in code after successful registration.
- Frontend organizer panel shows registrations for the selected event.
- Frontend refreshes registrations after a new participant is registered.
- Frontend check-in form connected to `POST /api/check-in`.
- Frontend can mark participants as `CheckedIn` and refresh the registrations list.
- Frontend login/register panel stores JWT access token locally.
- Frontend sends `Authorization: Bearer ...` for protected organizer requests.
- Frontend sidebar can switch between all events and the current organizer's events.
- Frontend organizer dashboard shows event, registration, checked-in, and capacity counts.
- Frontend organizer dashboard panel is extracted from `App.tsx`.
- Frontend auth panel is extracted from `App.tsx`.
- Frontend create event panel is extracted from `App.tsx`.
- Frontend event registration panel is extracted from `App.tsx`.
- Frontend event tickets panel is extracted from `App.tsx`.
- Frontend event management panel is extracted from `App.tsx`.
- Frontend event details panel is extracted from `App.tsx`.
- Frontend events sidebar is extracted from `App.tsx`.
- Frontend organizer registrations panel is extracted from `App.tsx`.
- Frontend workspace panel is extracted from `App.tsx`.
- Frontend structure cleanup milestone is complete for the current MVP screen.
- Frontend workspace tabs separate overview, event creation, and account panels.
- Frontend event edit form is hidden behind an explicit edit action to reduce detail-page clutter.
- Frontend ticket creation form is hidden behind an explicit action to reduce detail-page clutter.
- Frontend hides edit, ticket, participants, and check-in controls for events not managed by the current user.
- Frontend create event form loads categories and calls protected `POST /api/events`.
- Frontend refreshes the event list and selects the newly created draft event.
- Frontend edit event form calls protected `PUT /api/events/{id}`.
- Frontend refreshes event details and event list after editing.
- Frontend publish/cancel controls call protected event status endpoints.
- Frontend refreshes event details and event list after publishing or cancelling.
- Events now have `RegistrationEnabled` and `CheckInEnabled` settings.
- `PUT /api/events/{id}/settings` updates registration/check-in modes for organizer-owned events.
- Backend blocks participant registration for draft, cancelled, or registration-disabled events.
- Backend blocks check-in when check-in is disabled or the event lifecycle status does not allow it.
- Frontend organizer panel can update registration/check-in modes.
- Frontend disables public registration and organizer check-in forms when modes are closed.
- Frontend ticket form calls protected `POST /api/events/{id}/tickets`.
- Frontend refreshes selected event details after ticket creation.
- Frontend event details include a `.ics` calendar download button.
- Frontend event sidebar search and clearer event participation wording are added from the Pencil layout direction.
- Frontend event sidebar status filters replace placeholder filter chips.
- Frontend ticket panel shows event capacity and organizer-only occupied seats.
- Frontend registration panel shows selected ticket and account/manual participant context.
- Frontend organizer participants panel shows total, checked-in, and waiting counts.
- Frontend my registrations panel shows participant summary counts and clearer registration statuses.
- Frontend create event form is grouped into main, location, and time sections.
- Frontend event management panel shows status, registration, and check-in mode summary.
- Frontend edit event form is grouped into main, location, and time sections.
- Frontend account panel shows profile, role, active session, and token expiration summary.
- Frontend events sidebar shows visible and total event counts for the current filters.
- Frontend event statuses use Russian labels and distinct visual states.
- Frontend registration statuses use Russian labels and distinct visual states.
- Frontend event details show a dedicated calendar `.ics` panel with version and update data.
- Docker Compose runtime verified with PostgreSQL, API, frontend, migrations, seed data, Swagger, and API endpoints.

Known environment note:

- Docker Desktop requires hardware virtualization enabled in BIOS/UEFI.
- Docker Compose is now the preferred local full-stack runtime.

## Next Milestone: Frontend UX And Layout Polish

Goal:

```text
Make the MVP interface clearer and easier to use without changing backend behavior
```

Tasks:

- review the current screen flow for guest, participant, organizer, and event owner;
- improve event details layout, workspace panels, and organizer controls;
- optionally use a Pencil `.pen` layout file as a visual reference;
- keep React Router postponed until there are real separate pages.

Important product rule:

- the first check-in mode should be `OrganizerOnly`;
- self check-in should wait until authentication and event ownership checks exist.

## Backend MVP

### Events

- `GET /api/events`
- `GET /api/events/my`
- `GET /api/events/dashboard`
- `GET /api/events/{id}`
- `GET /api/events/{id}/calendar.ics`
- `POST /api/events`
- `PUT /api/events/{id}`
- `PUT /api/events/{id}/settings`
- `POST /api/events/{id}/publish`
- `POST /api/events/{id}/cancel`
- `POST /api/events/{id}/tickets`

### Categories

- `GET /api/categories`
- seed basic categories;
- optionally add admin-only category management later.

### Tickets

- create ticket types for an event;
- expose ticket data in event details;
- validate ticket capacity.

### Registrations

- `POST /api/events/{eventId}/registrations`
- prevent duplicate registration by event/user;
- create check-in code;
- `GET /api/registrations/my`;
- `GET /api/events/{eventId}/registrations`.

### Check-In

- `POST /api/check-in`
- find registration by check-in code;
- mark registration as checked in.

### Users/Auth

Completed:

- email/password registration and login;
- password hashing;
- JWT access token issuing.

Planned next:

- frontend structure cleanup;
- broader role policies as workflows grow;
- external login later, for example Yandex ID.

Access rules are tracked in [Authorization And Access Rules](AUTHORIZATION.md).

## Frontend MVP

Create React app after the first backend workflows are stable.

Pages:

- event list and event details are currently implemented in `App.tsx`;
- event list supports `All` and `My` scopes in `App.tsx`;
- event registration form is currently implemented in `App.tsx`;
- organizer registrations panel is currently implemented in `App.tsx`;
- organizer check-in form is currently implemented in `App.tsx`;
- login/register panel is currently implemented in `App.tsx`;
- create event form is currently implemented in `App.tsx`;
- edit event form is currently implemented in `App.tsx`;
- create ticket form is currently implemented in `App.tsx`;
- `.ics` calendar download button is currently implemented in `App.tsx`;
- `RegistrationPage`
- `DashboardPage`
- `LoginPage`

Frontend stack:

- React;
- TypeScript;
- Vite;
- React Router later, when multiple full pages are needed;
- TanStack Query later, when data fetching grows beyond the first MVP screen.

## Later Features

- QR code image generation;
- iCalendar subscription-style updates after a public deployment URL exists;
- registration/check-in modes: `OrganizerOnly`, `SelfCheckIn`, `EventCode`;
- Yandex ID or another external OAuth provider;
- email notification abstraction;
- fake payment service before real Stripe;
- organizer dashboard statistics;
- attendee export;
- better validation and global error responses;
- integration tests.

## Technical Quality Rules

- Keep Domain independent from infrastructure.
- Keep controllers thin.
- Put business workflows in Application.
- Put EF Core details in Infrastructure.
- Commit small working slices.
- Verify with `dotnet build EventManagement.sln` before pushing.
