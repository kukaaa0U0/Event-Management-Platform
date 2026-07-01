using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.Interfaces;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Persistence.Repositories;

public sealed class EventRepository : IEventRepository
{
    private readonly ApplicationDbContext _dbContext;

    public EventRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Event?> GetByIdAsync(EventId id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Events
            .Include(eventItem => eventItem.Tickets)
            .FirstOrDefaultAsync(eventItem => eventItem.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<Event>> GetPublishedAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Events
            .AsNoTracking()
            .Where(eventItem => eventItem.Status == EventStatus.Published)
            .OrderBy(eventItem => eventItem.StartsAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Event eventItem, CancellationToken cancellationToken = default)
    {
        await _dbContext.Events.AddAsync(eventItem, cancellationToken);
    }
}
