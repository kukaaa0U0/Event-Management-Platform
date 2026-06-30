using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Entities;

public sealed class Registration
{
    private Registration()
    {
    }

    public Registration(RegistrationId id, EventId eventId, UserId userId, TicketId ticketId, string checkInCode)
    {
        if (string.IsNullOrWhiteSpace(checkInCode))
        {
            throw new ArgumentException("Check-in code is required.", nameof(checkInCode));
        }

        Id = id;
        EventId = eventId;
        UserId = userId;
        TicketId = ticketId;
        CheckInCode = checkInCode.Trim();
        Status = RegistrationStatus.Confirmed;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public RegistrationId Id { get; private set; }

    public EventId EventId { get; private set; }

    public UserId UserId { get; private set; }

    public TicketId TicketId { get; private set; }

    public RegistrationStatus Status { get; private set; }

    public string CheckInCode { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime? CheckedInAtUtc { get; private set; }

    public void CheckIn(DateTime checkedInAtUtc)
    {
        if (Status == RegistrationStatus.Cancelled)
        {
            throw new InvalidOperationException("Cancelled registration cannot be checked in.");
        }

        Status = RegistrationStatus.CheckedIn;
        CheckedInAtUtc = checkedInAtUtc;
    }

    public void Cancel()
    {
        if (Status == RegistrationStatus.CheckedIn)
        {
            throw new InvalidOperationException("Checked-in registration cannot be cancelled.");
        }

        Status = RegistrationStatus.Cancelled;
    }
}
