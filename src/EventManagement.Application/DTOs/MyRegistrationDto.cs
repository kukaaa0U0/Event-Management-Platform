namespace EventManagement.Application.DTOs;

public sealed record MyRegistrationDto(
    Guid Id,
    Guid EventId,
    Guid TicketId,
    string EventTitle,
    string City,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string EventStatus,
    string RegistrationStatus,
    string CheckInCode,
    DateTime CreatedAtUtc,
    DateTime? CheckedInAtUtc);
