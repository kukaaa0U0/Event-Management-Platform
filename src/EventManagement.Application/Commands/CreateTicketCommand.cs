namespace EventManagement.Application.Commands;

public sealed record CreateTicketCommand(
    Guid EventId,
    Guid CurrentUserId,
    string CurrentUserRole,
    string Name,
    string Type,
    decimal PriceAmount,
    string PriceCurrency,
    int Capacity);
