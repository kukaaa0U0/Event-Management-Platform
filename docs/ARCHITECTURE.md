# Architecture

This project uses a pragmatic Clean Architecture layout for an educational event
management web platform.

## Layers

```text
EventManagement.API
    -> EventManagement.Application
    -> EventManagement.Infrastructure
        -> EventManagement.Application
        -> EventManagement.Domain
EventManagement.Application
    -> EventManagement.Domain
EventManagement.Domain
    -> no project dependencies
```

The dependency rule is simple: business code must not depend on API, database,
Docker, PostgreSQL, or UI concerns.

## Domain

Project:

```text
src/EventManagement.Domain
```

Purpose:

- stores business entities and rules;
- contains value objects and enums;
- defines repository contracts used by higher-level workflows.

Current domain model:

- `Event` - main aggregate for an event.
- `Ticket` - ticket type, price, and capacity.
- `Registration` - participant registration and check-in status.
- `User` - participant, organizer, or admin.
- `EventCategory` - category for event grouping.

`Event.OrganizerId` links an event to the user who owns and manages it.

Important value objects:

- `Email`
- `Money`
- `EventLocation`
- `EventDescription`
- typed ids such as `EventId`, `UserId`, `TicketId`.

Domain code should stay independent from EF Core attributes, controllers, HTTP,
PostgreSQL, and React.

## Application

Project:

```text
src/EventManagement.Application
```

Purpose:

- defines use-case contracts;
- contains DTOs returned to API/frontend;
- will contain commands, queries, handlers, and validators.

Current files:

- `DTOs/EventSummaryDto.cs`
- `Interfaces/IEventReadService.cs`

The API asks Application contracts for data or actions. Application does not know
whether data comes from PostgreSQL, a fake service, or another external system.

## Infrastructure

Project:

```text
src/EventManagement.Infrastructure
```

Purpose:

- implements persistence with EF Core and PostgreSQL;
- maps domain entities and value objects to database tables;
- implements repositories and application service contracts;
- contains migrations and database seed logic.

Current structure:

```text
Persistence/
├── ApplicationDbContext.cs
├── Configurations/
├── Migrations/
├── Repositories/
└── DatabaseInitializer.cs

Services/
└── EventReadService.cs
```

`DatabaseInitializer` applies EF migrations and inserts seed data when
`Database:MigrateOnStartup` is enabled.

## API

Project:

```text
src/EventManagement.API
```

Purpose:

- receives HTTP requests;
- exposes controllers and Swagger;
- configures dependency injection;
- hosts the application.

Current endpoints:

```text
GET /api/health
POST /api/auth/register
POST /api/auth/login
GET /api/categories
GET /api/events
GET /api/events/{id}
POST /api/events
POST /api/events/{id}/tickets
POST /api/events/{id}/publish
POST /api/events/{id}/cancel
POST /api/events/{eventId}/registrations
GET /api/events/{eventId}/registrations
POST /api/check-in
```

`GET /api/events` flow:

```text
Postman/browser
    -> EventsController
    -> IEventReadService
    -> EventReadService
    -> ApplicationDbContext
    -> PostgreSQL
```

Authentication foundation is partially implemented: users can register/login and
receive JWT access tokens. Organizer endpoints validate JWT tokens and enforce
event ownership or admin access for protected workflows. The intended role and
ownership rules are documented in [Authorization And Access Rules](AUTHORIZATION.md).

## Frontend

Project:

```text
frontend/
```

Purpose:

- hosts the React user interface;
- calls API endpoints through a small TypeScript API client;
- shows event list and event details from PostgreSQL-backed API data;
- lets a participant register for an event and receive a check-in code;
- shows organizer-facing registrations for the selected event;
- lets an organizer perform check-in by participant code;
- lets an organizer log in/register and stores JWT for protected requests;
- lets an authenticated organizer create a draft event;
- lets an authenticated organizer add tickets to an event they own;
- is served by nginx in Docker.

Current frontend stack:

- React;
- TypeScript;
- Vite;
- nginx for container runtime.

Current frontend flow:

```text
Browser
    -> frontend nginx on http://localhost:5173
    -> /api proxy
    -> EventManagement.API
    -> PostgreSQL
```

Create event flow:

```text
Organizer in React
    -> POST /api/events with JWT
    -> EventsController
    -> IEventWriteService
    -> ApplicationDbContext
    -> PostgreSQL
```

Create ticket flow:

```text
Organizer in React
    -> POST /api/events/{id}/tickets with JWT
    -> EventsController
    -> IEventWriteService
    -> EventWriteService checks event ownership/admin access
    -> ApplicationDbContext
    -> PostgreSQL
```

## Docker

Root files:

```text
docker-compose.yml
.dockerignore
src/EventManagement.API/Dockerfile
```

Docker Compose is intended to run:

- PostgreSQL;
- ASP.NET Core API.
- React frontend served by nginx.

Host ports:

- frontend: `http://localhost:5173`;
- API: `http://localhost:5000`;
- PostgreSQL from Windows tools: `localhost:5433`.

In Docker, the API receives:

```text
Database__MigrateOnStartup=true
```

That means migrations and seed data are applied automatically when the API
container starts.
