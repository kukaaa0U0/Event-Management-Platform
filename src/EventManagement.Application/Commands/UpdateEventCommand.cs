namespace EventManagement.Application.Commands;

public sealed record UpdateEventCommand(
    Guid EventId,
    Guid CurrentUserId,
    string CurrentUserRole,
    Guid CategoryId,
    string Title,
    string Description,
    string City,
    string Address,
    string? VenueName,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc);
