using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IRegistrationService
{
    Task<RegistrationDto?> RegisterForEventAsync(
        RegisterForEventCommand command,
        CancellationToken cancellationToken = default);

    Task<RegistrationDto?> CheckInAsync(
        CheckInCommand command,
        CancellationToken cancellationToken = default);
}
