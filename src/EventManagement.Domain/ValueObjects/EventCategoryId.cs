namespace EventManagement.Domain.ValueObjects;

public readonly record struct EventCategoryId(Guid Value)
{
    public static EventCategoryId New() => new(Guid.NewGuid());
}
