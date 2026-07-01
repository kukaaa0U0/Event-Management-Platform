using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IEventReadService
{
    Task<IReadOnlyCollection<EventSummaryDto>> GetEventsAsync(CancellationToken cancellationToken = default);
}
