namespace EventManagement.API.Models;

public sealed record LoginRequest(
    string Email,
    string Password);
