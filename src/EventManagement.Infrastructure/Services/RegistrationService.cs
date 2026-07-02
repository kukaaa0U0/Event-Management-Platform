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

    public async Task<RegistrationDto?> RegisterForEventAsync(
        RegisterForEventCommand command,
        CancellationToken cancellationToken = default)
    {
        var eventId = new EventId(command.EventId);
        var ticketId = new TicketId(command.TicketId);
        var email = Email.Create(command.Email);

        var eventExists = await _dbContext.Events
            .AnyAsync(eventItem => eventItem.Id == eventId, cancellationToken);

        if (!eventExists)
        {
            return null;
        }

        var ticketExists = await _dbContext.Tickets
            .AnyAsync(ticket => ticket.Id == ticketId && ticket.EventId == eventId, cancellationToken);

        if (!ticketExists)
        {
            return null;
        }

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(existingUser => existingUser.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User(UserId.New(), command.FullName, email, UserRole.Participant);
            await _dbContext.Users.AddAsync(user, cancellationToken);
        }

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
