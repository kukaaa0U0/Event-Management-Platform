using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Entities;

public sealed class Ticket
{
    private Ticket()
    {
    }

    public Ticket(TicketId id, EventId eventId, string name, TicketType type, Money price, int capacity)
    {
        if (capacity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity), "Ticket capacity must be greater than zero.");
        }

        Id = id;
        EventId = eventId;
        Rename(name);
        Type = type;
        Price = price;
        Capacity = capacity;
    }

    public TicketId Id { get; private set; }

    public EventId EventId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public TicketType Type { get; private set; }

    public Money Price { get; private set; } = null!;

    public int Capacity { get; private set; }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Ticket name is required.", nameof(name));
        }

        Name = name.Trim();
    }
}
