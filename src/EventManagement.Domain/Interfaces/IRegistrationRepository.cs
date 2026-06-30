using EventManagement.Domain.Entities;
using EventManagement.Domain.ValueObjects;

namespace EventManagement.Domain.Interfaces;

public interface IRegistrationRepository
{
    Task<Registration?> GetByIdAsync(RegistrationId id, CancellationToken cancellationToken = default);

    Task<Registration?> GetByCheckInCodeAsync(string checkInCode, CancellationToken cancellationToken = default);

    Task AddAsync(Registration registration, CancellationToken cancellationToken = default);
}
