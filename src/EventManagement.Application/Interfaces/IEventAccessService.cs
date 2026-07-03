namespace EventManagement.Application.Interfaces;

public interface IEventAccessService
{
    Task<bool> CanManageEventAsync(
        Guid currentUserId,
        string currentUserRole,
        Guid eventId,
        CancellationToken cancellationToken = default);

    Task<bool> CanCheckInAsync(
        Guid currentUserId,
        string currentUserRole,
        string checkInCode,
        CancellationToken cancellationToken = default);

    Task<Guid?> GetEventIdByCheckInCodeAsync(
        string checkInCode,
        CancellationToken cancellationToken = default);
}
