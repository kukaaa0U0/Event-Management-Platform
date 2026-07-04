namespace EventManagement.API.Models;

public sealed record CreateTicketRequest(
    string Name,
    string Type,
    decimal PriceAmount,
    string PriceCurrency,
    int Capacity);
