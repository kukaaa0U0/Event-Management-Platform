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
- Seed data for initial events, categories, organizer, and tickets.
- Docker Compose runtime verified with PostgreSQL, migrations, seed data, Swagger, and API endpoints.

Known environment note:

- Docker Desktop requires hardware virtualization enabled in BIOS/UEFI.
- Docker Compose is now the preferred local full-stack runtime.

## Next Milestone: Create Events

Goal:

```text
POST /api/events creates a draft event in PostgreSQL
```

Tasks:

- add request DTO for creating an event;
- add FluentValidation package and validator;
- add Application command/service contract;
- implement creation through EF Core;
- return created event details or location header;
- test from Swagger/Postman.

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
- list registrations for an event.

### Check-In

- `POST /api/check-in`
- find registration by check-in code;
- mark registration as checked in.

### Users/Auth

Start simple:

- temporary users or seeded users;
- then add registration/login;
- then add JWT authentication and roles.

## Frontend MVP

Create React app after the first backend workflows are stable.

Pages:

- `EventListPage`
- `EventDetailsPage`
- `CreateEventPage`
- `RegistrationPage`
- `DashboardPage`
- `LoginPage`

Frontend stack:

- React;
- TypeScript;
- Vite;
- React Router;
- TanStack Query.

## Later Features

- QR code image generation;
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
