using EventManagement.Domain.Entities;
using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Interfaces;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(EventId id, CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<Event>> GetPublishedAsync(CancellationToken cancellationToken = default);

    Task AddAsync(Event eventItem, CancellationToken cancellationToken = default);
}
