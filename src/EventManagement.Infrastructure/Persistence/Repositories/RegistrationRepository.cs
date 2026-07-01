using EventManagement.Domain.Entities;
using EventManagement.Domain.Interfaces;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Persistence.Repositories;

public sealed class RegistrationRepository : IRegistrationRepository
{
    private readonly ApplicationDbContext _dbContext;

    public RegistrationRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Registration?> GetByIdAsync(RegistrationId id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Registrations
            .FirstOrDefaultAsync(registration => registration.Id == id, cancellationToken);
    }

    public async Task<Registration?> GetByCheckInCodeAsync(string checkInCode, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Registrations
            .FirstOrDefaultAsync(registration => registration.CheckInCode == checkInCode, cancellationToken);
    }

    public async Task AddAsync(Registration registration, CancellationToken cancellationToken = default)
    {
        await _dbContext.Registrations.AddAsync(registration, cancellationToken);
    }
}
