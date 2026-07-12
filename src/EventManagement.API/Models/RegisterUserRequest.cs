namespace EventManagement.API.Models;

public sealed record RegisterUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role);
