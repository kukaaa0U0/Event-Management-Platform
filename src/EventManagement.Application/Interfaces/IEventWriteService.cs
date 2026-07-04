using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IEventWriteService
{
    Task<EventDetailsDto?> CreateEventAsync(CreateEventCommand command, CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> UpdateEventAsync(UpdateEventCommand command, CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> CreateTicketAsync(CreateTicketCommand command, CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> PublishEventAsync(
        Guid id,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<EventDetailsDto?> CancelEventAsync(
        Guid id,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);
}
