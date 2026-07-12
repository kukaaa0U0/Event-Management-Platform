using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using EventManagement.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;

namespace EventManagement.Tests;

public sealed class AuthAndRoleTests
{
    [Theory]
    [InlineData("Participant")]
    [InlineData("Organizer")]
    public async Task RegisterAsync_WithAllowedRole_ReturnsSelectedRole(string role)
    {
        await using var dbContext = CreateDbContext();
        var authService = CreateAuthService(dbContext);

        var response = await authService.RegisterAsync(new RegisterUserCommand(
            $"{role} User",
            $"{role.ToLowerInvariant()}-{Guid.NewGuid():N}@example.com",
            "Password123!",
            role));

        Assert.Equal(role, response.Role);
    }

    [Fact]
    public async Task RegisterAsync_WithAdminRole_Throws()
    {
        await using var dbContext = CreateDbContext();
        var authService = CreateAuthService(dbContext);

        var exception = await Assert.ThrowsAsync<ArgumentException>(() =>
            authService.RegisterAsync(new RegisterUserCommand(
                "Admin User",
                $"admin-{Guid.NewGuid():N}@example.com",
                "Password123!",
                "Admin")));

        Assert.Equal("Role must be Participant or Organizer.", exception.Message);
    }

    [Fact]
    public async Task CreateEventAsync_WithParticipantRole_Throws()
    {
        await using var dbContext = CreateDbContext();
        var participant = new User(
            UserId.New(),
            "Participant User",
            Email.Create($"participant-{Guid.NewGuid():N}@example.com"),
            UserRole.Participant);
        var eventWriteService = new EventWriteService(
            dbContext,
            new EmptyEventReadService(),
            new AllowAllEventAccessService());

        await dbContext.Users.AddAsync(participant);
        await dbContext.SaveChangesAsync();

        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            eventWriteService.CreateEventAsync(new CreateEventCommand(
                participant.Id.Value,
                UserRole.Participant.ToString(),
                Guid.NewGuid(),
                "Participant Event",
                "Participant event description",
                "Moscow",
                "Test address",
                null,
                DateTime.UtcNow.AddDays(5),
                DateTime.UtcNow.AddDays(5).AddHours(2))));

        Assert.Equal("Only organizers and admins can create events.", exception.Message);
    }

    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static AuthService CreateAuthService(ApplicationDbContext dbContext)
    {
        return new AuthService(dbContext, new JwtTokenService(new TestConfiguration(new Dictionary<string, string?>
        {
            ["Jwt:Issuer"] = "EventManagement.Tests",
            ["Jwt:Audience"] = "EventManagement.Tests",
            ["Jwt:Secret"] = "test-secret-with-enough-length-for-hmac",
            ["Jwt:ExpirationMinutes"] = "120"
        })));
    }

    private sealed class TestConfiguration : IConfiguration
    {
        private readonly IReadOnlyDictionary<string, string?> _values;

        public TestConfiguration(IReadOnlyDictionary<string, string?> values)
        {
            _values = values;
        }

        public string? this[string key]
        {
            get => _values.TryGetValue(key, out var value) ? value : null;
            set => throw new NotSupportedException();
        }

        public IEnumerable<IConfigurationSection> GetChildren()
        {
            return [];
        }

        public IChangeToken GetReloadToken()
        {
            return new EmptyChangeToken();
        }

        public IConfigurationSection GetSection(string key)
        {
            return new EmptyConfigurationSection(key);
        }
    }

    private sealed class EmptyChangeToken : IChangeToken
    {
        public bool ActiveChangeCallbacks => false;

        public bool HasChanged => false;

        public IDisposable RegisterChangeCallback(Action<object?> callback, object? state)
        {
            return EmptyDisposable.Instance;
        }
    }

    private sealed class EmptyConfigurationSection : IConfigurationSection
    {
        public EmptyConfigurationSection(string key)
        {
            Key = key;
            Path = key;
        }

        public string? this[string key]
        {
            get => null;
            set => throw new NotSupportedException();
        }

        public string Key { get; }

        public string Path { get; }

        public string? Value { get; set; }

        public IEnumerable<IConfigurationSection> GetChildren()
        {
            return [];
        }

        public IChangeToken GetReloadToken()
        {
            return new EmptyChangeToken();
        }

        public IConfigurationSection GetSection(string key)
        {
            return new EmptyConfigurationSection(key);
        }
    }

    private sealed class EmptyDisposable : IDisposable
    {
        public static readonly EmptyDisposable Instance = new();

        public void Dispose()
        {
        }
    }

    private sealed class EmptyEventReadService : IEventReadService
    {
        public Task<IReadOnlyCollection<EventSummaryDto>> GetEventsAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyCollection<EventSummaryDto>>([]);
        }

        public Task<IReadOnlyCollection<EventSummaryDto>> GetManagedEventsAsync(
            Guid currentUserId,
            string currentUserRole,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyCollection<EventSummaryDto>>([]);
        }

        public Task<IReadOnlyCollection<OrganizerDashboardEventDto>> GetOrganizerDashboardAsync(
            Guid currentUserId,
            string currentUserRole,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyCollection<OrganizerDashboardEventDto>>([]);
        }

        public Task<EventDetailsDto?> GetEventDetailsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<EventDetailsDto?>(null);
        }
    }

    private sealed class AllowAllEventAccessService : IEventAccessService
    {
        public Task<bool> CanManageEventAsync(
            Guid currentUserId,
            string currentUserRole,
            Guid eventId,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<bool> CanCheckInAsync(
            Guid currentUserId,
            string currentUserRole,
            string checkInCode,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<Guid?> GetEventIdByCheckInCodeAsync(
            string checkInCode,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<Guid?>(null);
        }
    }
}
