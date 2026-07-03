using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken = default);

    Task<AuthResponseDto?> LoginAsync(
        LoginCommand command,
        CancellationToken cancellationToken = default);
}
