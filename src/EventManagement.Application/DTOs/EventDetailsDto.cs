namespace EventManagement.Application.DTOs;

public sealed record EventDetailsDto(
    Guid Id,
    string Title,
    string Description,
    string City,
    string Address,
    string? VenueName,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Status,
    IReadOnlyCollection<TicketDto> Tickets);
