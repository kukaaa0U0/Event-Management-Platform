namespace EventManagement.Application.Commands;

public sealed record UpdateEventSettingsCommand(
    Guid EventId,
    Guid CurrentUserId,
    string CurrentUserRole,
    bool RegistrationEnabled,
    bool CheckInEnabled);
