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
GET /api/categories
GET /api/events
GET /api/events/{id}
POST /api/events
POST /api/events/{id}/publish
POST /api/events/{id}/cancel
POST /api/events/{eventId}/registrations
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

## Frontend

React frontend is planned but not created yet.

Expected future project:

```text
frontend/
```

Expected responsibilities:

- event list page;
- event details page;
- create event page;
- registration page;
- organizer dashboard;
- API client and React Query hooks.

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

In Docker, the API receives:

```text
Database__MigrateOnStartup=true
```

That means migrations and seed data are applied automatically when the API
container starts.
