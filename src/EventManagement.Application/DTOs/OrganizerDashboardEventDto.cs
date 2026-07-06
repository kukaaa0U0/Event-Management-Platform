namespace EventManagement.Application.DTOs;

public sealed record OrganizerDashboardEventDto(
    Guid EventId,
    string Title,
    string Status,
    DateTime StartsAtUtc,
    bool RegistrationEnabled,
    bool CheckInEnabled,
    int TicketCapacity,
    int RegistrationsCount,
    int CheckedInCount);
