using EventManagement.API.Models;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/check-in")]
public sealed class CheckInController : ControllerBase
{
    private readonly IRegistrationService _registrationService;

    public CheckInController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationDto>> CheckIn(
        CheckInRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CheckInCode))
        {
            return BadRequest(new { message = "CheckInCode is required." });
        }

        try
        {
            var registration = await _registrationService.CheckInAsync(
                new CheckInCommand(request.CheckInCode),
                cancellationToken);

            if (registration is null)
            {
                return NotFound(new { message = "Check-in code was not found." });
            }

            return Ok(registration);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
