using EventManagement.API.Models;
using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
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

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<EventDetailsDto>> PublishEvent(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var eventDetails = await _eventWriteService.PublishEventAsync(id, cancellationToken);

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
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<EventDetailsDto>> CancelEvent(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var eventDetails = await _eventWriteService.CancelEventAsync(id, cancellationToken);

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
}
