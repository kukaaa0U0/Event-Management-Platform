using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class RegistrationService : IRegistrationService
{
    private readonly ApplicationDbContext _dbContext;

    public RegistrationService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<RegistrationDto>?> GetEventRegistrationsAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        var typedEventId = new EventId(eventId);

        var eventExists = await _dbContext.Events
            .AnyAsync(eventItem => eventItem.Id == typedEventId, cancellationToken);

        if (!eventExists)
        {
            return null;
        }

        var rows = await _dbContext.Registrations
            .AsNoTracking()
            .Where(registration => registration.EventId == typedEventId)
            .Join(
                _dbContext.Users.AsNoTracking(),
                registration => registration.UserId,
                user => user.Id,
                (registration, user) => new { Registration = registration, User = user })
            .OrderBy(row => row.User.FullName)
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => ToDto(row.Registration, row.User))
            .ToList();
    }

    public async Task<IReadOnlyCollection<MyRegistrationDto>> GetUserRegistrationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var typedUserId = new UserId(userId);

        var rows = await _dbContext.Registrations
            .AsNoTracking()
            .Where(registration => registration.UserId == typedUserId)
            .Join(
                _dbContext.Events.AsNoTracking(),
                registration => registration.EventId,
                eventItem => eventItem.Id,
                (registration, eventItem) => new { Registration = registration, Event = eventItem })
            .OrderBy(row => row.Event.StartsAtUtc)
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new MyRegistrationDto(
                row.Registration.Id.Value,
                row.Registration.EventId.Value,
                row.Registration.TicketId.Value,
                row.Event.Title,
                row.Event.Location.City,
                row.Event.StartsAtUtc,
                row.Event.EndsAtUtc,
                row.Event.Status.ToString(),
                row.Registration.Status.ToString(),
                row.Registration.CheckInCode,
                row.Registration.CreatedAtUtc,
                row.Registration.CheckedInAtUtc))
            .ToList();
    }

    public async Task<RegistrationDto?> RegisterForEventAsync(
        RegisterForEventCommand command,
        CancellationToken cancellationToken = default)
    {
        var eventId = new EventId(command.EventId);
        var ticketId = new TicketId(command.TicketId);

        var eventItem = await _dbContext.Events
            .FirstOrDefaultAsync(item => item.Id == eventId, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        eventItem.EnsureRegistrationIsOpen();

        var ticketExists = await _dbContext.Tickets
            .AnyAsync(ticket => ticket.Id == ticketId && ticket.EventId == eventId, cancellationToken);

        if (!ticketExists)
        {
            return null;
        }

        var user = command.CurrentUserId.HasValue
            ? await GetCurrentUserAsync(command.CurrentUserId.Value, cancellationToken)
            : await GetOrCreateAnonymousUserAsync(command.FullName, command.Email, cancellationToken);

        var alreadyRegistered = await _dbContext.Registrations
            .AnyAsync(registration => registration.EventId == eventId && registration.UserId == user.Id, cancellationToken);

        if (alreadyRegistered)
        {
            throw new InvalidOperationException("Participant is already registered for this event.");
        }

        var registration = new Registration(
            RegistrationId.New(),
            eventId,
            user.Id,
            ticketId,
            GenerateCheckInCode());

        await _dbContext.Registrations.AddAsync(registration, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(registration, user);
    }

    private async Task<User> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var typedUserId = new UserId(userId);

        return await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == typedUserId, cancellationToken)
            ?? throw new InvalidOperationException("Authenticated user was not found.");
    }

    private async Task<User> GetOrCreateAnonymousUserAsync(
        string fullName,
        string emailValue,
        CancellationToken cancellationToken)
    {
        var email = Email.Create(emailValue);
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(existingUser => existingUser.Email == email, cancellationToken);

        if (user is not null)
        {
            return user;
        }

        user = new User(UserId.New(), fullName, email, UserRole.Participant);
        await _dbContext.Users.AddAsync(user, cancellationToken);

        return user;
    }

    public async Task<RegistrationDto?> CheckInAsync(
        CheckInCommand command,
        CancellationToken cancellationToken = default)
    {
        var checkInCode = command.CheckInCode.Trim().ToUpperInvariant();

        var registration = await _dbContext.Registrations
            .FirstOrDefaultAsync(item => item.CheckInCode == checkInCode, cancellationToken);

        if (registration is null)
        {
            return null;
        }

        var eventItem = await _dbContext.Events
            .FirstAsync(item => item.Id == registration.EventId, cancellationToken);

        eventItem.EnsureCheckInIsOpen();

        if (registration.Status == RegistrationStatus.CheckedIn)
        {
            throw new InvalidOperationException("Participant is already checked in.");
        }

        registration.CheckIn(DateTime.UtcNow);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstAsync(item => item.Id == registration.UserId, cancellationToken);

        return ToDto(registration, user);
    }

    private static string GenerateCheckInCode()
    {
        return $"CHK-{Guid.NewGuid():N}"[..16].ToUpperInvariant();
    }

    private static RegistrationDto ToDto(Registration registration, User user)
    {
        return new RegistrationDto(
            registration.Id.Value,
            registration.EventId.Value,
            registration.TicketId.Value,
            user.Id.Value,
            user.FullName,
            user.Email.Value,
            registration.Status.ToString(),
            registration.CheckInCode,
            registration.CreatedAtUtc,
            registration.CheckedInAtUtc);
    }
}
