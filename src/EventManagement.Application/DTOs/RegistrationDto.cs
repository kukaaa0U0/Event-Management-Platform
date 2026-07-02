namespace EventManagement.Application.DTOs;

public sealed record RegistrationDto(
    Guid Id,
    Guid EventId,
    Guid TicketId,
    Guid UserId,
    string ParticipantName,
    string ParticipantEmail,
    string Status,
    string CheckInCode,
    DateTime CreatedAtUtc);
