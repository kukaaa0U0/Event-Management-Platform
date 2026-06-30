namespace EventManagement.API.Models;

public sealed record EventSummaryResponse(
    Guid Id,
    string Title,
    string Description,
    string City,
    string Address,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Status);
