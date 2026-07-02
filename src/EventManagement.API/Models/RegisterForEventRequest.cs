namespace EventManagement.API.Models;

public sealed record RegisterForEventRequest(
    Guid TicketId,
    string FullName,
    string Email);
