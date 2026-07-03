using EventManagement.API.Models;
using EventManagement.API.Extensions;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/check-in")]
public sealed class CheckInController : ControllerBase
{
    private readonly IRegistrationService _registrationService;
    private readonly IEventAccessService _eventAccessService;

    public CheckInController(
        IRegistrationService registrationService,
        IEventAccessService eventAccessService)
    {
        _registrationService = registrationService;
        _eventAccessService = eventAccessService;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<RegistrationDto>> CheckIn(
        CheckInRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CheckInCode))
        {
            return BadRequest(new { message = "CheckInCode is required." });
        }

        var checkInEventId = await _eventAccessService.GetEventIdByCheckInCodeAsync(
            request.CheckInCode,
            cancellationToken);

        if (checkInEventId is null)
        {
            return NotFound(new { message = "Check-in code was not found." });
        }

        if (!await _eventAccessService.CanManageEventAsync(
                User.GetUserId(),
                User.GetUserRole(),
                checkInEventId.Value,
                cancellationToken))
        {
            return Forbid();
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
