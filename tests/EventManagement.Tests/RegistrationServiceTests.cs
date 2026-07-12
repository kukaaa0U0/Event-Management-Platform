using EventManagement.Application.Commands;
using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using EventManagement.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using DomainEvent = EventManagement.Domain.Entities.Event;

namespace EventManagement.Tests;

public sealed class RegistrationServiceTests
{
    [Fact]
    public async Task RegisterForEventAsync_WithPublishedEvent_CreatesConfirmedRegistration()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true);
        var service = new RegistrationService(dbContext);

        var registration = await service.RegisterForEventAsync(new RegisterForEventCommand(
            fixture.EventId.Value,
            fixture.TicketId.Value,
            "Test Participant",
            "participant@example.com"));

        Assert.NotNull(registration);
        Assert.Equal("Confirmed", registration.Status);
        Assert.Equal(fixture.EventId.Value, registration.EventId);
        Assert.Equal(fixture.TicketId.Value, registration.TicketId);
        Assert.Equal(1, await dbContext.Registrations.CountAsync());
    }

    [Fact]
    public async Task RegisterForEventAsync_WithDraftEvent_Throws()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: false);
        var service = new RegistrationService(dbContext);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterForEventAsync(new RegisterForEventCommand(
                fixture.EventId.Value,
                fixture.TicketId.Value,
                "Test Participant",
                "participant@example.com")));

        Assert.Equal("Registration is available only for published events.", exception.Message);
    }

    [Fact]
    public async Task RegisterForEventAsync_WithDuplicateAuthenticatedUser_Throws()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true);
        var participant = await AddUserAsync(dbContext, "Duplicate Participant", "duplicate@example.com");
        var service = new RegistrationService(dbContext);
        var command = new RegisterForEventCommand(
            fixture.EventId.Value,
            fixture.TicketId.Value,
            participant.FullName,
            participant.Email.Value,
            participant.Id.Value);

        await service.RegisterForEventAsync(command);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterForEventAsync(command));

        Assert.Equal("Participant is already registered for this event.", exception.Message);
    }

    [Fact]
    public async Task RegisterForEventAsync_WithFullTicket_Throws()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true, ticketCapacity: 1);
        var service = new RegistrationService(dbContext);

        await service.RegisterForEventAsync(new RegisterForEventCommand(
            fixture.EventId.Value,
            fixture.TicketId.Value,
            "First Participant",
            "first@example.com"));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterForEventAsync(new RegisterForEventCommand(
                fixture.EventId.Value,
                fixture.TicketId.Value,
                "Second Participant",
                "second@example.com")));

        Assert.Equal("Ticket capacity has been reached.", exception.Message);
    }

    [Fact]
    public async Task RegisterForEventAsync_WithInvalidTicket_ReturnsNull()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true);
        var service = new RegistrationService(dbContext);

        var registration = await service.RegisterForEventAsync(new RegisterForEventCommand(
            fixture.EventId.Value,
            Guid.NewGuid(),
            "Test Participant",
            "participant@example.com"));

        Assert.Null(registration);
    }

    [Fact]
    public async Task CheckInAsync_WithEnabledCheckIn_MarksRegistrationAsCheckedIn()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true, checkInEnabled: true);
        var service = new RegistrationService(dbContext);
        var registration = await service.RegisterForEventAsync(new RegisterForEventCommand(
            fixture.EventId.Value,
            fixture.TicketId.Value,
            "Test Participant",
            "participant@example.com"));

        var checkedIn = await service.CheckInAsync(new CheckInCommand(registration!.CheckInCode));

        Assert.NotNull(checkedIn);
        Assert.Equal("CheckedIn", checkedIn.Status);
        Assert.NotNull(checkedIn.CheckedInAtUtc);
    }

    [Fact]
    public async Task CheckInAsync_WithDisabledCheckIn_Throws()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true, checkInEnabled: false);
        var service = new RegistrationService(dbContext);
        var registration = await service.RegisterForEventAsync(new RegisterForEventCommand(
            fixture.EventId.Value,
            fixture.TicketId.Value,
            "Test Participant",
            "participant@example.com"));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CheckInAsync(new CheckInCommand(registration!.CheckInCode)));

        Assert.Equal("Check-in is disabled for this event.", exception.Message);
    }

    [Fact]
    public async Task CheckInAsync_WithAlreadyCheckedInParticipant_Throws()
    {
        await using var dbContext = CreateDbContext();
        var fixture = await SeedEventAsync(dbContext, publish: true, checkInEnabled: true);
        var service = new RegistrationService(dbContext);
        var registration = await service.RegisterForEventAsync(new RegisterForEventCommand(
            fixture.EventId.Value,
            fixture.TicketId.Value,
            "Test Participant",
            "participant@example.com"));

        await service.CheckInAsync(new CheckInCommand(registration!.CheckInCode));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CheckInAsync(new CheckInCommand(registration.CheckInCode)));

        Assert.Equal("Participant is already checked in.", exception.Message);
    }

    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static async Task<EventFixture> SeedEventAsync(
        ApplicationDbContext dbContext,
        bool publish,
        bool checkInEnabled = false,
        int ticketCapacity = 10)
    {
        var organizerId = UserId.New();
        var categoryId = EventCategoryId.New();
        var eventId = EventId.New();
        var ticketId = TicketId.New();

        var organizer = new User(
            organizerId,
            "Test Organizer",
            Email.Create($"organizer-{Guid.NewGuid():N}@example.com"),
            UserRole.Organizer);

        var category = new EventCategory(categoryId, "Technology");
        var eventItem = new DomainEvent(
            eventId,
            organizerId,
            categoryId,
            "Test Event",
            EventDescription.Create("Test event description"),
            EventLocation.Create("Moscow", "Test address", "Test venue"),
            DateTime.UtcNow.AddDays(7),
            DateTime.UtcNow.AddDays(7).AddHours(2));

        if (publish)
        {
            eventItem.Publish();
        }

        if (checkInEnabled)
        {
            eventItem.UpdateAvailability(registrationEnabled: true, checkInEnabled: true);
        }

        eventItem.AddTicket(new Ticket(
            ticketId,
            eventId,
            "Regular",
            TicketType.Regular,
            Money.Create(0),
            ticketCapacity));

        await dbContext.Users.AddAsync(organizer);
        await dbContext.EventCategories.AddAsync(category);
        await dbContext.Events.AddAsync(eventItem);
        await dbContext.SaveChangesAsync();

        return new EventFixture(eventId, ticketId);
    }

    private static async Task<User> AddUserAsync(ApplicationDbContext dbContext, string fullName, string email)
    {
        var user = new User(UserId.New(), fullName, Email.Create(email), UserRole.Participant);
        await dbContext.Users.AddAsync(user);
        await dbContext.SaveChangesAsync();

        return user;
    }

    private sealed record EventFixture(EventId EventId, TicketId TicketId);
}
