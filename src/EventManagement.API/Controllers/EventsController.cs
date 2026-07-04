using EventManagement.API.Models;
using EventManagement.API.Extensions;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class EventsController : ControllerBase
{
    private readonly IEventReadService _eventReadService;
    private readonly IEventWriteService _eventWriteService;

    public EventsController(IEventReadService eventReadService, IEventWriteService eventWriteService)
    {
        _eventReadService = eventReadService;
        _eventWriteService = eventWriteService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<EventSummaryDto>>> GetEvents(CancellationToken cancellationToken)
    {
        return Ok(await _eventReadService.GetEventsAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDetailsDto>> GetEventDetails(Guid id, CancellationToken cancellationToken)
    {
        var eventDetails = await _eventReadService.GetEventDetailsAsync(id, cancellationToken);

        if (eventDetails is null)
        {
            return NotFound();
        }

        return Ok(eventDetails);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<EventDetailsDto>> CreateEvent(
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateCreateEventRequest(request);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var command = new CreateEventCommand(
            User.GetUserId(),
            request.CategoryId,
            request.Title,
            request.Description,
            request.City,
            request.Address,
            request.VenueName,
            request.StartsAtUtc,
            request.EndsAtUtc);

        try
        {
            var createdEvent = await _eventWriteService.CreateEventAsync(command, cancellationToken);

            if (createdEvent is null)
            {
                return BadRequest(new { message = "Category was not found." });
            }

            return CreatedAtAction(nameof(GetEventDetails), new { id = createdEvent.Id }, createdEvent);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/tickets")]
    [Authorize]
    public async Task<ActionResult<EventDetailsDto>> CreateTicket(
        Guid id,
        CreateTicketRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateCreateTicketRequest(request);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var command = new CreateTicketCommand(
            id,
            User.GetUserId(),
            User.GetUserRole(),
            request.Name,
            request.Type,
            request.PriceAmount,
            request.PriceCurrency,
            request.Capacity);

        try
        {
            var eventDetails = await _eventWriteService.CreateTicketAsync(command, cancellationToken);

            if (eventDetails is null)
            {
                return NotFound();
            }

            return Ok(eventDetails);
        }
        catch (ArgumentOutOfRangeException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize]
    public async Task<ActionResult<EventDetailsDto>> PublishEvent(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var eventDetails = await _eventWriteService.PublishEventAsync(
                id,
                User.GetUserId(),
                User.GetUserRole(),
                cancellationToken);

            if (eventDetails is null)
            {
                return NotFound();
            }

            return Ok(eventDetails);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<ActionResult<EventDetailsDto>> CancelEvent(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var eventDetails = await _eventWriteService.CancelEventAsync(
                id,
                User.GetUserId(),
                User.GetUserRole(),
                cancellationToken);

            if (eventDetails is null)
            {
                return NotFound();
            }

            return Ok(eventDetails);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    private static string? ValidateCreateEventRequest(CreateEventRequest request)
    {
        if (request.CategoryId == Guid.Empty)
        {
            return "CategoryId is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return "Title is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return "Description is required.";
        }

        if (string.IsNullOrWhiteSpace(request.City))
        {
            return "City is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Address))
        {
            return "Address is required.";
        }

        if (request.EndsAtUtc <= request.StartsAtUtc)
        {
            return "EndsAtUtc must be later than StartsAtUtc.";
        }

        return null;
    }

    private static string? ValidateCreateTicketRequest(CreateTicketRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Name is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Type))
        {
            return "Type is required.";
        }

        if (request.PriceAmount < 0)
        {
            return "PriceAmount cannot be negative.";
        }

        if (string.IsNullOrWhiteSpace(request.PriceCurrency))
        {
            return "PriceCurrency is required.";
        }

        if (request.Capacity <= 0)
        {
            return "Capacity must be greater than zero.";
        }

        return null;
    }
}
