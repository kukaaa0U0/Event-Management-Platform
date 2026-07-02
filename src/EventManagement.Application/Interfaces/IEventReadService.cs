using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IEventReadService
{
    Task<IReadOnlyCollection<EventSummaryDto>> GetEventsAsync(CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> GetEventDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
