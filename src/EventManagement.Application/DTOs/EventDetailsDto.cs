namespace EventManagement.Application.DTOs;

public sealed record EventDetailsDto(
    Guid Id,
    Guid CategoryId,
    string Title,
    string Description,
    string City,
    string Address,
    string? VenueName,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Status,
    DateTime UpdatedAtUtc,
    int CalendarSequence,
    IReadOnlyCollection<TicketDto> Tickets);
