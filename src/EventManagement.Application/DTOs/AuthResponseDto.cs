namespace EventManagement.Application.DTOs;

public sealed record AuthResponseDto(
    Guid UserId,
    string FullName,
    string Email,
    string Role,
    string AccessToken,
    DateTime ExpiresAtUtc);
