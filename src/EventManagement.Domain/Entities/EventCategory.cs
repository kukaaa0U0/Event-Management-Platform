using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Entities;

public sealed class EventCategory
{
    private EventCategory()
    {
    }

    public EventCategory(EventCategoryId id, string name)
    {
        Id = id;
        Rename(name);
    }

    public EventCategoryId Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Category name is required.", nameof(name));
        }

        Name = name.Trim();
    }
}
