using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IEventWriteService
{
    Task<EventDetailsDto?> CreateEventAsync(CreateEventCommand command, CancellationToken cancellationToken = default);
}
