using EventManagement.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class EventsController : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyCollection<EventSummaryResponse>> GetEvents()
    {
        var events = new List<EventSummaryResponse>
        {
            new(
                Guid.Parse("9bcf9c70-6ab3-4f71-a3d1-a53d9718eb63"),
                "Student Tech Meetup",
                "Introductory meetup for students interested in web development.",
                "Moscow",
                "University campus, building 2",
                DateTime.UtcNow.AddDays(14),
                DateTime.UtcNow.AddDays(14).AddHours(3),
                "Published"),
            new(
                Guid.Parse("143179b1-0e32-44f1-b567-15de88c9a7e4"),
                "Backend Workshop",
                "Practical workshop about ASP.NET Core Web API and PostgreSQL.",
                "Moscow",
                "Coworking Hall",
                DateTime.UtcNow.AddDays(30),
                DateTime.UtcNow.AddDays(30).AddHours(4),
                "Draft")
        };

        return Ok(events);
    }
}
