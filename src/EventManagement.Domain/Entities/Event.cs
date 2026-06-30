using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Entities;

public sealed class Event
{
    private readonly List<Ticket> _tickets = [];

    private Event()
    {
    }

    public Event(
        EventId id,
        UserId organizerId,
        EventCategoryId categoryId,
        string title,
        EventDescription description,
        EventLocation location,
        DateTime startsAtUtc,
        DateTime endsAtUtc)
    {
        Id = id;
        OrganizerId = organizerId;
        CategoryId = categoryId;
        UpdateDetails(title, description, location, startsAtUtc, endsAtUtc);
        Status = EventStatus.Draft;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public EventId Id { get; private set; }

    public UserId OrganizerId { get; private set; }

    public EventCategoryId CategoryId { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public EventDescription Description { get; private set; } = null!;

    public EventLocation Location { get; private set; } = null!;

    public DateTime StartsAtUtc { get; private set; }

    public DateTime EndsAtUtc { get; private set; }

    public EventStatus Status { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public IReadOnlyCollection<Ticket> Tickets => _tickets.AsReadOnly();

    public void UpdateDetails(
        string title,
        EventDescription description,
        EventLocation location,
        DateTime startsAtUtc,
        DateTime endsAtUtc)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Event title is required.", nameof(title));
        }

        if (endsAtUtc <= startsAtUtc)
        {
            throw new ArgumentException("Event end date must be later than start date.", nameof(endsAtUtc));
        }

        Title = title.Trim();
        Description = description;
        Location = location;
        StartsAtUtc = startsAtUtc;
        EndsAtUtc = endsAtUtc;
    }

    public void Publish()
    {
        if (Status != EventStatus.Draft)
        {
            throw new InvalidOperationException("Only draft events can be published.");
        }

        Status = EventStatus.Published;
    }

    public void Cancel()
    {
        if (Status == EventStatus.Completed)
        {
            throw new InvalidOperationException("Completed events cannot be cancelled.");
        }

        Status = EventStatus.Cancelled;
    }

    public void AddTicket(Ticket ticket)
    {
        if (ticket.EventId != Id)
        {
            throw new InvalidOperationException("Ticket belongs to another event.");
        }

        _tickets.Add(ticket);
    }
}
