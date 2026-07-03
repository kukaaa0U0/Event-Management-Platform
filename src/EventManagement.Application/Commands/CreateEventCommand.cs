namespace EventManagement.Application.Commands;

public sealed record CreateEventCommand(
    Guid OrganizerId,
    Guid CategoryId,
    string Title,
    string Description,
    string City,
    string Address,
    string? VenueName,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc);
