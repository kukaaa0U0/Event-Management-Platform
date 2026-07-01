using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
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
            .Select(eventItem => new EventSummaryDto(
                eventItem.Id.Value,
                eventItem.Title,
                eventItem.Description.Value,
                eventItem.Location.City,
                eventItem.Location.Address,
                eventItem.StartsAtUtc,
                eventItem.EndsAtUtc,
                eventItem.Status.ToString()))
            .ToList();
    }
}
