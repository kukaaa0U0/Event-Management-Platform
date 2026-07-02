using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IEventWriteService
{
    Task<EventDetailsDto?> CreateEventAsync(CreateEventCommand command, CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> PublishEventAsync(Guid id, CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> CancelEventAsync(Guid id, CancellationToken cancellationToken = default);
}
