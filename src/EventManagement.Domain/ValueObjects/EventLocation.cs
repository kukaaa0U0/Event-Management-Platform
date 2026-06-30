namespace EventManagement.Domain.ValueObjects;

public sealed record EventLocation
{
    private EventLocation(string city, string address, string? venueName)
    {
        City = city;
        Address = address;
        VenueName = venueName;
    }

    public string City { get; }

    public string Address { get; }

    public string? VenueName { get; }

    public static EventLocation Create(string city, string address, string? venueName = null)
    {
        if (string.IsNullOrWhiteSpace(city))
        {
            throw new ArgumentException("City is required.", nameof(city));
        }

        if (string.IsNullOrWhiteSpace(address))
        {
            throw new ArgumentException("Address is required.", nameof(address));
        }

        return new EventLocation(city.Trim(), address.Trim(), string.IsNullOrWhiteSpace(venueName) ? null : venueName.Trim());
    }
}
