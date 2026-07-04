using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IEventCalendarService
{
    Task<EventCalendarFileDto?> GetEventCalendarFileAsync(
        Guid eventId,
        CancellationToken cancellationToken = default);
}
