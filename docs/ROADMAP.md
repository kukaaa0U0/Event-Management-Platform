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
- Frontend shows generated check-in code after successful registration.
- Frontend organizer panel shows registrations for the selected event.
- Frontend refreshes registrations after a new participant is registered.
- Frontend check-in form connected to `POST /api/check-in`.
- Frontend can mark participants as `CheckedIn` and refresh the registrations list.
- Frontend login/register panel stores JWT access token locally.
- Frontend sends `Authorization: Bearer ...` for protected organizer requests.
- Frontend sidebar can switch between all events and the current organizer's events.
- Frontend hides edit, ticket, participants, and check-in controls for events not managed by the current user.
- Frontend create event form loads categories and calls protected `POST /api/events`.
- Frontend refreshes the event list and selects the newly created draft event.
- Frontend edit event form calls protected `PUT /api/events/{id}`.
- Frontend refreshes event details and event list after editing.
- Frontend ticket form calls protected `POST /api/events/{id}/tickets`.
- Frontend refreshes selected event details after ticket creation.
- Frontend event details include a `.ics` calendar download button.
- Docker Compose runtime verified with PostgreSQL, API, frontend, migrations, seed data, Swagger, and API endpoints.

Known environment note:

- Docker Desktop requires hardware virtualization enabled in BIOS/UEFI.
- Docker Compose is now the preferred local full-stack runtime.

## Next Milestone: Publish And Cancel Controls

Goal:

```text
Organizer can publish or cancel events from the React web app
```

Tasks:

- add frontend actions for `POST /api/events/{id}/publish`;
- add frontend actions for `POST /api/events/{id}/cancel`;
- refresh event details and event list after status changes;
- keep actions visible only for events managed by the current user.

Important product rule:

- the first check-in mode should be `OrganizerOnly`;
- self check-in should wait until authentication and event ownership checks exist.

## Backend MVP

### Events

- `GET /api/events`
- `GET /api/events/my`
- `GET /api/events/{id}`
- `GET /api/events/{id}/calendar.ics`
- `POST /api/events`
- `PUT /api/events/{id}`
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

- frontend publish/cancel controls;
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
