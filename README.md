# Event Management Platform

Учебная web-платформа для создания и управления событиями.

## Как открыть проект

Открывайте в Visual Studio файл:

```text
EventManagement.sln
```

В решении сейчас 4 backend-проекта:

- `EventManagement.Domain` - доменные сущности, value objects, enum'ы и интерфейсы.
- `EventManagement.Application` - будущие commands, queries, DTO и сервисные интерфейсы.
- `EventManagement.Infrastructure` - будущая работа с EF Core, PostgreSQL и внешними сервисами.
- `EventManagement.API` - ASP.NET Core Web API с контроллерами.

Исходный код лежит в папке `src/`.

## Проверка сборки

```bash
dotnet build EventManagement.sln
```
