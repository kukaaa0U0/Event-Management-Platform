FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EventManagement.sln", "./"]
COPY ["src/EventManagement.API/EventManagement.API.csproj", "src/EventManagement.API/"]
COPY ["src/EventManagement.Application/EventManagement.Application.csproj", "src/EventManagement.Application/"]
COPY ["src/EventManagement.Domain/EventManagement.Domain.csproj", "src/EventManagement.Domain/"]
COPY ["src/EventManagement.Infrastructure/EventManagement.Infrastructure.csproj", "src/EventManagement.Infrastructure/"]
RUN dotnet restore "src/EventManagement.API/EventManagement.API.csproj"
COPY . .
RUN dotnet publish "src/EventManagement.API/EventManagement.API.csproj" -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "EventManagement.API.dll"]
