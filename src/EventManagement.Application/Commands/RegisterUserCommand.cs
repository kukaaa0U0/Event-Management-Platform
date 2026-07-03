namespace EventManagement.Application.Commands;

public sealed record RegisterUserCommand(
    string FullName,
    string Email,
    string Password);
