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
- `GET /api/events/{id}` wired to database read service with ticket details.
- `GET /api/categories`.
- `POST /api/events` creates draft events in PostgreSQL.
- `POST /api/events/{id}/publish`.
- `POST /api/events/{id}/cancel`.
- `POST /api/events/{eventId}/registrations` creates participant registrations.
- `GET /api/events/{eventId}/registrations` lists participants for an event.
- `POST /api/check-in` marks participants as checked in by check-in code.
- Seed data for initial events, categories, organizer, and tickets.
- React/Vite frontend foundation.
- Frontend event list and event details screen connected to API.
- Frontend registration form connected to `POST /api/events/{eventId}/registrations`.
- Frontend shows generated check-in code after successful registration.
- Frontend organizer panel shows registrations for the selected event.
- Frontend refreshes registrations after a new participant is registered.
- Frontend check-in form connected to `POST /api/check-in`.
- Frontend can mark participants as `CheckedIn` and refresh the registrations list.
- Docker Compose runtime verified with PostgreSQL, API, frontend, migrations, seed data, Swagger, and API endpoints.

Known environment note:

- Docker Desktop requires hardware virtualization enabled in BIOS/UEFI.
- Docker Compose is now the preferred local full-stack runtime.

## Next Milestone: Authentication Foundation

Goal:

```text
Users can register, log in, and receive a JWT token
```

Tasks:

- add password hash field to users;
- add `POST /api/auth/register`;
- add `POST /api/auth/login`;
- issue JWT access tokens;
- keep role and event ownership enforcement for the next slice.

Important product rule:

- the first check-in mode should be `OrganizerOnly`;
- self check-in should wait until authentication and event ownership checks exist.

## Backend MVP

### Events

- `GET /api/events`
- `GET /api/events/{id}`
- `POST /api/events`
- `PUT /api/events/{id}`
- `POST /api/events/{id}/publish`
- `POST /api/events/{id}/cancel`

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

Planned order:

- email/password registration and login;
- password hashing;
- JWT authentication;
- roles: `Participant`, `Organizer`, `Admin`;
- event ownership checks through `Event.OrganizerId`;
- external login later, for example Yandex ID.

Access rules are tracked in [Authorization And Access Rules](AUTHORIZATION.md).

## Frontend MVP

Create React app after the first backend workflows are stable.

Pages:

- event list and event details are currently implemented in `App.tsx`;
- event registration form is currently implemented in `App.tsx`;
- organizer registrations panel is currently implemented in `App.tsx`;
- organizer check-in form is currently implemented in `App.tsx`;
- `CreateEventPage`
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
