namespace EventManagement.Domain.ValueObjects;

public readonly record struct RegistrationId(Guid Value)
{
    public static RegistrationId New() => new(Guid.NewGuid());
}
