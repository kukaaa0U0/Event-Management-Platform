using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly JwtTokenService _jwtTokenService;

    public AuthService(ApplicationDbContext dbContext, JwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponseDto> RegisterAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken = default)
    {
        var email = Email.Create(command.Email);
        var existingUser = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Email == email, cancellationToken);

        if (existingUser is not null && existingUser.PasswordHash is not null)
        {
            throw new InvalidOperationException("User with this email is already registered.");
        }

        var passwordHash = PasswordHashingService.Hash(command.Password);
        var user = existingUser;

        if (user is null)
        {
            user = new User(
                UserId.New(),
                command.FullName,
                email,
                UserRole.Organizer,
                passwordHash);

            await _dbContext.Users.AddAsync(user, cancellationToken);
        }
        else
        {
            user.ChangeName(command.FullName);
            user.ChangeRole(UserRole.Organizer);
            user.SetPasswordHash(passwordHash);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreateResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(
        LoginCommand command,
        CancellationToken cancellationToken = default)
    {
        var email = Email.Create(command.Email);
        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Email == email, cancellationToken);

        if (user?.PasswordHash is null)
        {
            return null;
        }

        if (!PasswordHashingService.Verify(command.Password, user.PasswordHash))
        {
            return null;
        }

        return CreateResponse(user);
    }

    private AuthResponseDto CreateResponse(User user)
    {
        var token = _jwtTokenService.CreateToken(user);

        return new AuthResponseDto(
            user.Id.Value,
            user.FullName,
            user.Email.Value,
            user.Role.ToString(),
            token.Token,
            token.ExpiresAtUtc);
    }
}
