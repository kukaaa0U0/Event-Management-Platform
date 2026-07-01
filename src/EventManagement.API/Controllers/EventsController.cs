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
}
