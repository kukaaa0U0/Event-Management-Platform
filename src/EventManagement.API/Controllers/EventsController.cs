using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class EventsController : ControllerBase
{
    private readonly IEventReadService _eventReadService;

    public EventsController(IEventReadService eventReadService)
    {
        _eventReadService = eventReadService;
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
}
