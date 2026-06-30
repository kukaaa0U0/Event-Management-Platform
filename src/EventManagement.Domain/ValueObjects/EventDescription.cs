namespace EventManagement.Domain.ValueObjects;

public sealed record EventDescription
{
    private const int MaxLength = 4000;

    private EventDescription(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static EventDescription Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Description is required.", nameof(value));
        }

        var trimmed = value.Trim();

        if (trimmed.Length > MaxLength)
        {
            throw new ArgumentException($"Description cannot exceed {MaxLength} characters.", nameof(value));
        }

        return new EventDescription(trimmed);
    }

    public override string ToString() => Value;
}
