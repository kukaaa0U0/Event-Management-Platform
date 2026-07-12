# Event Management Platform

Educational full-stack web platform for creating, publishing, registering for,
and managing events.

## Current MVP

- ASP.NET Core Web API with controllers and Swagger.
- Clean Architecture projects: Domain, Application, Infrastructure, API.
- PostgreSQL persistence through EF Core.
- Docker Compose runtime for PostgreSQL, API, and React frontend.
- React + TypeScript + Vite frontend.
- Email/password auth with JWT access tokens.
- Roles: `Participant`, `Organizer`, `Admin`.
- Organizers and admins can create and manage events.
- Participants can register for published events and see their registrations.
- Tickets with capacity checks.
- Organizer check-in by generated check-in code.
- Event categories and sidebar filters.
- `.ics` calendar file download for events.
- Backend service tests for registration, check-in, and role guards.

## Quick Start

Start the full stack:

```bash
docker compose up --build
```

Open the web app:

```text
http://localhost:5173
```

API:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/swagger
```

## Seed Accounts

```text
admin@example.com / Admin123! / Admin
organizer@example.com / no password by default / Organizer
```

New users can self-register as `Participant` or `Organizer`. The `Admin` role
cannot be self-assigned through public registration.

## Project Structure

```text
src/
  EventManagement.Domain/          Domain entities, value objects, enums
  EventManagement.Application/     Commands, DTOs, interfaces
  EventManagement.Infrastructure/  EF Core, PostgreSQL, services
  EventManagement.API/             Controllers, auth, Swagger, DI
frontend/                          React/Vite frontend
tests/                             xUnit backend tests
docs/                              Architecture, setup, roadmap, auth rules
```

Open in Visual Studio:

```text
EventManagement.sln
```

## Build And Test

Build:

```bash
dotnet build EventManagement.sln --no-restore -m:1 /nodeReuse:false
```

Safe solution-level test command:

```bash
dotnet test EventManagement.sln --no-build --no-restore -m:1 /nodeReuse:false
```

Frontend build:

```bash
cd frontend
npm install
npm run build
```

## Useful Endpoints

```text
GET  /api/health
POST /api/auth/register
POST /api/auth/login
GET  /api/categories
GET  /api/events
GET  /api/events/my
GET  /api/events/dashboard
GET  /api/events/{id}
GET  /api/events/{id}/calendar.ics
POST /api/events
PUT  /api/events/{id}
PUT  /api/events/{id}/settings
POST /api/events/{id}/tickets
POST /api/events/{id}/publish
POST /api/events/{id}/cancel
POST /api/events/{eventId}/registrations
GET  /api/events/{eventId}/registrations
GET  /api/registrations/my
POST /api/check-in
```

Protected endpoints require:

```text
Authorization: Bearer <accessToken>
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Setup](docs/SETUP.md)
- [Roadmap](docs/ROADMAP.md)
- [Authorization And Access Rules](docs/AUTHORIZATION.md)
- [MVP Manual Test Pass](docs/MVP_MANUAL_TEST.md)

## Notes

Docker Desktop on Windows requires hardware virtualization enabled in BIOS/UEFI.
Docker Compose exposes PostgreSQL on host port `5433`, API on `5000`, and the
frontend on `5173`.
