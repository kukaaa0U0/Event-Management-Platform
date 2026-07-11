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

        var categoryNames = await GetCategoryNamesAsync(events, cancellationToken);

        return events
            .Select(eventItem => ToSummaryDto(eventItem, categoryNames))
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

        var categoryNames = await GetCategoryNamesAsync(events, cancellationToken);

        return events
            .Select(eventItem => ToSummaryDto(eventItem, categoryNames))
            .ToList();
    }

    public async Task<IReadOnlyCollection<OrganizerDashboardEventDto>> GetOrganizerDashboardAsync(
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Event> query = _dbContext.Events
            .AsNoTracking()
            .Include(eventItem => eventItem.Tickets);

        if (!currentUserRole.Equals(UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            var organizerId = new UserId(currentUserId);
            query = query.Where(eventItem => eventItem.OrganizerId == organizerId);
        }

        var events = await query
            .OrderBy(eventItem => eventItem.StartsAtUtc)
            .ToListAsync(cancellationToken);

        var eventIds = events
            .Select(eventItem => eventItem.Id)
            .ToList();

        List<Registration> registrations = eventIds.Count == 0
            ? []
            : await _dbContext.Registrations
                .AsNoTracking()
                .Where(registration => eventIds.Contains(registration.EventId))
                .ToListAsync(cancellationToken);

        var registrationStats = registrations
            .GroupBy(registration => registration.EventId)
            .ToDictionary(
                group => group.Key,
                group => new
                {
                    Total = group.Count(),
                    CheckedIn = group.Count(registration => registration.Status == RegistrationStatus.CheckedIn)
                });

        return events
            .Select(eventItem =>
            {
                registrationStats.TryGetValue(eventItem.Id, out var stats);

                return new OrganizerDashboardEventDto(
                    eventItem.Id.Value,
                    eventItem.Title,
                    eventItem.Status.ToString(),
                    eventItem.StartsAtUtc,
                    eventItem.RegistrationEnabled,
                    eventItem.CheckInEnabled,
                    eventItem.Tickets.Sum(ticket => ticket.Capacity),
                    stats?.Total ?? 0,
                    stats?.CheckedIn ?? 0);
            })
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

        var categoryName = await _dbContext.EventCategories
            .AsNoTracking()
            .Where(category => category.Id == eventItem.CategoryId)
            .Select(category => category.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? "Uncategorized";

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
            categoryName,
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
            eventItem.RegistrationEnabled,
            eventItem.CheckInEnabled,
            tickets);
    }

    private async Task<Dictionary<EventCategoryId, string>> GetCategoryNamesAsync(
        IReadOnlyCollection<Event> events,
        CancellationToken cancellationToken)
    {
        var categoryIds = events
            .Select(eventItem => eventItem.CategoryId)
            .Distinct()
            .ToList();

        if (categoryIds.Count == 0)
        {
            return [];
        }

        return await _dbContext.EventCategories
            .AsNoTracking()
            .Where(category => categoryIds.Contains(category.Id))
            .ToDictionaryAsync(category => category.Id, category => category.Name, cancellationToken);
    }

    private static EventSummaryDto ToSummaryDto(
        Event eventItem,
        IReadOnlyDictionary<EventCategoryId, string> categoryNames)
    {
        var categoryName = categoryNames.TryGetValue(eventItem.CategoryId, out var name)
            ? name
            : "Uncategorized";

        return new EventSummaryDto(
            eventItem.Id.Value,
            eventItem.CategoryId.Value,
            categoryName,
            eventItem.Title,
            eventItem.Description.Value,
            eventItem.Location.City,
            eventItem.Location.Address,
            eventItem.StartsAtUtc,
            eventItem.EndsAtUtc,
            eventItem.Status.ToString());
    }
}
