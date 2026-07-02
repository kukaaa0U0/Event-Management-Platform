namespace EventManagement.Application.DTOs;

public sealed record TicketDto(
    Guid Id,
    string Name,
    string Type,
    decimal PriceAmount,
    string PriceCurrency,
    int Capacity);
