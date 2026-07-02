# Setup

This document describes how to run the project locally.

## Requirements

- .NET 8 SDK or newer.
- PostgreSQL 17 or compatible.
- Optional: Docker Desktop.
- Optional later: Node.js for React frontend.

## Open Project

Open this file in Visual Studio:

```text
EventManagement.sln
```

Startup project:

```text
EventManagement.API
```

Local API URL:

```text
http://localhost:5000
```

Swagger:

```text
http://localhost:5000/swagger
```

## Build

```bash
dotnet build EventManagement.sln
```

## Run API Without Database

This starts the API and allows checking Swagger and health endpoint:

```bash
dotnet build EventManagement.sln
dotnet run --project src/EventManagement.API/EventManagement.API.csproj --no-build --urls http://localhost:5000
```

Check:

```text
GET http://localhost:5000/api/health
```

`GET /api/events` requires PostgreSQL because it reads from the database.

## PostgreSQL

Current local connection string:

```text
Host=localhost;Port=5432;Database=event_management;Username=postgres;Password=postgres
```

The database needed for this project:

```text
event_management
```

If using pgAdmin:

1. Open pgAdmin.
2. Connect to the local PostgreSQL server.
3. Create a database named `event_management` if it does not exist.

## Apply Migrations

From repository root:

```bash
dotnet build EventManagement.sln
dotnet ef database update --project src/EventManagement.Infrastructure/EventManagement.Infrastructure.csproj --startup-project src/EventManagement.API/EventManagement.API.csproj
```

If `dotnet ef` is not installed:

```bash
dotnet tool install --global dotnet-ef
```

## Seed Data

Seed data is applied by `DatabaseInitializer` when this setting is enabled:

```json
{
  "Database": {
    "MigrateOnStartup": true
  }
}
```

For local Visual Studio runs it is currently disabled:

```json
{
  "Database": {
    "MigrateOnStartup": false
  }
}
```

In Docker Compose it is enabled through environment variables.

## Docker

Docker Desktop on Windows requires hardware virtualization enabled in BIOS/UEFI.

When Docker is ready:

```bash
docker compose up --build
```

Expected services:

- PostgreSQL on host port `5432`;
- API on host port `5000`.

## Useful Endpoints

```text
GET http://localhost:5000/api/health
GET http://localhost:5000/api/categories
GET http://localhost:5000/api/events
GET http://localhost:5000/api/events/{id}
POST http://localhost:5000/api/events
```

## Troubleshooting

If API starts but `/api/events` fails:

- PostgreSQL may not be running;
- database `event_management` may not exist;
- migrations may not be applied;
- connection string password may differ from local PostgreSQL password.

If Docker fails on Windows:

- enable hardware virtualization in BIOS/UEFI;
- restart Windows;
- start Docker Desktop;
- wait until Docker engine is running.
