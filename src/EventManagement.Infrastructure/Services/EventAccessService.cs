using EventManagement.Application.Interfaces;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class EventAccessService : IEventAccessService
{
    private readonly ApplicationDbContext _dbContext;

    public EventAccessService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> CanManageEventAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        if (IsAdmin(currentUserRole))
        {
            return true;
        }

        var typedEventId = new EventId(eventId);
        var typedUserId = new UserId(currentUserId);

        return await _dbContext.Events
            .AsNoTracking()
            .AnyAsync(
                eventItem => eventItem.Id == typedEventId && eventItem.OrganizerId == typedUserId,
                cancellationToken);
    }

    public async Task<bool> CanCheckInAsync(
        Guid currentUserId,
        string currentUserRole,
        string checkInCode,
        CancellationToken cancellationToken = default)
    {
        if (IsAdmin(currentUserRole))
        {
            return true;
        }

        var normalizedCode = checkInCode.Trim().ToUpperInvariant();
        var typedUserId = new UserId(currentUserId);

        return await _dbContext.Registrations
            .AsNoTracking()
            .Where(registration => registration.CheckInCode == normalizedCode)
            .Join(
                _dbContext.Events.AsNoTracking(),
                registration => registration.EventId,
                eventItem => eventItem.Id,
                (registration, eventItem) => eventItem)
            .AnyAsync(eventItem => eventItem.OrganizerId == typedUserId, cancellationToken);
    }

    public async Task<Guid?> GetEventIdByCheckInCodeAsync(
        string checkInCode,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = checkInCode.Trim().ToUpperInvariant();

        var registration = await _dbContext.Registrations
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.CheckInCode == normalizedCode, cancellationToken);

        return registration?.EventId.Value;
    }

    private static bool IsAdmin(string role)
    {
        return string.Equals(role, UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase);
    }
}
