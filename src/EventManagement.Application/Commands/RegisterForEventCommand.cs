namespace EventManagement.Application.Commands;

public sealed record RegisterForEventCommand(
    Guid EventId,
    Guid TicketId,
    string FullName,
    string Email,
    Guid? CurrentUserId = null);
