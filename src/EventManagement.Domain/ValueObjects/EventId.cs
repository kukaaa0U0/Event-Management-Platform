namespace EventManagement.Domain.ValueObjects;

public readonly record struct EventId(Guid Value)
{
    public static EventId New() => new(Guid.NewGuid());
}
