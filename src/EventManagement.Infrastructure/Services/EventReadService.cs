using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class EventReadService : IEventReadService
{
    private readonly ApplicationDbContext _dbContext;

    public EventReadService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<EventSummaryDto>> GetEventsAsync(CancellationToken cancellationToken = default)
    {
        var events = await _dbContext.Events
            .AsNoTracking()
            .OrderBy(eventItem => eventItem.StartsAtUtc)
            .ToListAsync(cancellationToken);

        return events
            .Select(ToSummaryDto)
            .ToList();
    }

    public async Task<IReadOnlyCollection<EventSummaryDto>> GetManagedEventsAsync(
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Events
            .AsNoTracking();

        if (!currentUserRole.Equals(UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            var organizerId = new UserId(currentUserId);
            query = query.Where(eventItem => eventItem.OrganizerId == organizerId);
        }

        var events = await query
            .OrderBy(eventItem => eventItem.StartsAtUtc)
            .ToListAsync(cancellationToken);

        return events
            .Select(ToSummaryDto)
            .ToList();
    }

    public async Task<EventDetailsDto?> GetEventDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventId = new EventId(id);

        var eventItem = await _dbContext.Events
            .AsNoTracking()
            .Include(item => item.Tickets)
            .FirstOrDefaultAsync(item => item.Id == eventId, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        var tickets = eventItem.Tickets
            .OrderBy(ticket => ticket.Type)
            .ThenBy(ticket => ticket.Name)
            .Select(ticket => new TicketDto(
                ticket.Id.Value,
                ticket.Name,
                ticket.Type.ToString(),
                ticket.Price.Amount,
                ticket.Price.Currency,
                ticket.Capacity))
            .ToList();

        return new EventDetailsDto(
            eventItem.Id.Value,
            eventItem.CategoryId.Value,
            eventItem.Title,
            eventItem.Description.Value,
            eventItem.Location.City,
            eventItem.Location.Address,
            eventItem.Location.VenueName,
            eventItem.StartsAtUtc,
            eventItem.EndsAtUtc,
            eventItem.Status.ToString(),
            eventItem.UpdatedAtUtc,
            eventItem.CalendarSequence,
            tickets);
    }

    private static EventSummaryDto ToSummaryDto(Event eventItem)
    {
        return new EventSummaryDto(
            eventItem.Id.Value,
            eventItem.Title,
            eventItem.Description.Value,
            eventItem.Location.City,
            eventItem.Location.Address,
            eventItem.StartsAtUtc,
            eventItem.EndsAtUtc,
            eventItem.Status.ToString());
    }
}
