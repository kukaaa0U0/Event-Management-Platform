using EventManagement.API.Models;
using EventManagement.API.Extensions;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

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

    [HttpGet("export.csv")]
    [Authorize]
    public async Task<IActionResult> ExportEventRegistrations(
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

        var builder = new StringBuilder();
        builder.AppendLine("ParticipantName,ParticipantEmail,Status,CheckInCode,RegisteredAtUtc,CheckedInAtUtc");

        foreach (var registration in registrations)
        {
            builder
                .Append(CsvEscape(registration.ParticipantName)).Append(',')
                .Append(CsvEscape(registration.ParticipantEmail)).Append(',')
                .Append(CsvEscape(registration.Status)).Append(',')
                .Append(CsvEscape(registration.CheckInCode)).Append(',')
                .Append(CsvEscape(registration.CreatedAtUtc.ToString("O"))).Append(',')
                .Append(CsvEscape(registration.CheckedInAtUtc?.ToString("O") ?? string.Empty))
                .AppendLine();
        }

        return File(
            new UTF8Encoding(encoderShouldEmitUTF8Identifier: true).GetBytes(builder.ToString()),
            "text/csv; charset=utf-8",
            $"event-{eventId:N}-registrations.csv");
    }

    [HttpPost]
    public async Task<ActionResult<RegistrationDto>> RegisterForEvent(
        Guid eventId,
        RegisterForEventRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.Identity?.IsAuthenticated == true
            ? User.GetUserId()
            : (Guid?)null;

        var validationError = ValidateRequest(request, currentUserId.HasValue);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var command = new RegisterForEventCommand(
            eventId,
            request.TicketId,
            request.FullName,
            request.Email,
            currentUserId);

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

    private static string? ValidateRequest(RegisterForEventRequest request, bool hasAuthenticatedUser)
    {
        if (request.TicketId == Guid.Empty)
        {
            return "TicketId is required.";
        }

        if (!hasAuthenticatedUser && string.IsNullOrWhiteSpace(request.FullName))
        {
            return "FullName is required.";
        }

        if (!hasAuthenticatedUser && string.IsNullOrWhiteSpace(request.Email))
        {
            return "Email is required.";
        }

        return null;
    }

    private static string CsvEscape(string value)
    {
        if (!value.Contains(',') && !value.Contains('"') && !value.Contains('\n') && !value.Contains('\r'))
        {
            return value;
        }

        return $"\"{value.Replace("\"", "\"\"")}\"";
    }
}
