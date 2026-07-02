namespace EventManagement.API.Models;

public sealed record CreateEventRequest(
    Guid CategoryId,
    string Title,
    string Description,
    string City,
    string Address,
    string? VenueName,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc);
