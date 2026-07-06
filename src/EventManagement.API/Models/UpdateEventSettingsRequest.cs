namespace EventManagement.API.Models;

public sealed record UpdateEventSettingsRequest(
    bool RegistrationEnabled,
    bool CheckInEnabled);
