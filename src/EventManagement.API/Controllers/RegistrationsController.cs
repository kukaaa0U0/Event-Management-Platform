using EventManagement.API.Models;
using EventManagement.API.Extensions;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/registrations")]
public sealed class RegistrationsController : ControllerBase
{
    private readonly IRegistrationService _registrationService;
    private readonly IEventAccessService _eventAccessService;

    public RegistrationsController(
        IRegistrationService registrationService,
        IEventAccessService eventAccessService)
    {
        _registrationService = registrationService;
        _eventAccessService = eventAccessService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyCollection<RegistrationDto>>> GetEventRegistrations(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        if (!await _eventAccessService.CanManageEventAsync(
                User.GetUserId(),
                User.GetUserRole(),
                eventId,
                cancellationToken))
        {
            return Forbid();
        }

        var registrations = await _registrationService.GetEventRegistrationsAsync(eventId, cancellationToken);

        if (registrations is null)
        {
            return NotFound();
        }

        return Ok(registrations);
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationDto>> RegisterForEvent(
        Guid eventId,
        RegisterForEventRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var command = new RegisterForEventCommand(
            eventId,
            request.TicketId,
            request.FullName,
            request.Email);

        try
        {
            var registration = await _registrationService.RegisterForEventAsync(command, cancellationToken);

            if (registration is null)
            {
                return BadRequest(new { message = "Event or ticket was not found." });
            }

            return Created(string.Empty, registration);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        catch (DbUpdateException exception) when (exception.InnerException?.Message.Contains("IX_registrations_EventId_UserId") == true)
        {
            return Conflict(new { message = "Participant is already registered for this event." });
        }
    }

    private static string? ValidateRequest(RegisterForEventRequest request)
    {
        if (request.TicketId == Guid.Empty)
        {
            return "TicketId is required.";
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return "FullName is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return "Email is required.";
        }

        return null;
    }
}
