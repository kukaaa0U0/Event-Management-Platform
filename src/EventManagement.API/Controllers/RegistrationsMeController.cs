using EventManagement.API.Extensions;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/registrations")]
public sealed class RegistrationsMeController : ControllerBase
{
    private readonly IRegistrationService _registrationService;

    public RegistrationsMeController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyCollection<MyRegistrationDto>>> GetMyRegistrations(
        CancellationToken cancellationToken)
    {
        return Ok(await _registrationService.GetUserRegistrationsAsync(
            User.GetUserId(),
            cancellationToken));
    }
}
