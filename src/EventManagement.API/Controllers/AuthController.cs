using EventManagement.API.Models;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(
        RegisterUserRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRegisterRequest(request);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        try
        {
            var response = await _authService.RegisterAsync(
                new RegisterUserCommand(request.FullName, request.Email, request.Password, request.Role),
                cancellationToken);

            return Created(string.Empty, response);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        AuthResponseDto? response;

        try
        {
            response = await _authService.LoginAsync(
                new LoginCommand(request.Email, request.Password),
                cancellationToken);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        if (response is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(response);
    }

    private static string? ValidateRegisterRequest(RegisterUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return "FullName is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "Email is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return "Password is required.";
        }

        if (request.Password.Length < 8)
        {
            return "Password must be at least 8 characters long.";
        }

        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return "Role is required.";
        }

        return null;
    }
}
