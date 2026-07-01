# Event Management Platform

Educational web platform for creating and managing events.

## Project Structure

Open this file in Visual Studio:

```text
EventManagement.sln
```

Backend projects:

- `EventManagement.Domain` - entities, value objects, enums, repository contracts.
- `EventManagement.Application` - future commands, queries, DTOs, validators, service contracts.
- `EventManagement.Infrastructure` - EF Core, PostgreSQL, repositories, external service implementations.
- `EventManagement.API` - ASP.NET Core Web API with controllers and Swagger.

Source code is stored in `src/`.

## Local API Check

Run `EventManagement.API` from Visual Studio or use:

```bash
dotnet build EventManagement.sln
dotnet run --project src/EventManagement.API/EventManagement.API.csproj --no-build --urls http://localhost:5000
```

Open:

```text
http://localhost:5000
```

Useful endpoints:

```text
GET http://localhost:5000/api/health
GET http://localhost:5000/api/events
```

`GET /api/events` reads data from PostgreSQL. Without a running database, Swagger and
`GET /api/health` still work, but event queries require PostgreSQL.

## Build

```bash
dotnet build EventManagement.sln
```

## Database

Local PostgreSQL connection string:

```text
Host=localhost;Port=5432;Database=event_management;Username=postgres;Password=postgres
```

Docker Compose starts PostgreSQL and the API:

```bash
docker compose up --build
```

Docker Desktop on Windows requires hardware virtualization enabled in BIOS/UEFI.
In Docker Compose, migrations and seed data are applied automatically on API startup.

## EF Core Migrations

Create a migration:

```bash
dotnet ef migrations add MigrationName --no-build --project src/EventManagement.Infrastructure/EventManagement.Infrastructure.csproj --startup-project src/EventManagement.API/EventManagement.API.csproj --output-dir Persistence/Migrations
```

Apply migrations:

```bash
dotnet ef database update --project src/EventManagement.Infrastructure/EventManagement.Infrastructure.csproj --startup-project src/EventManagement.API/EventManagement.API.csproj
```
