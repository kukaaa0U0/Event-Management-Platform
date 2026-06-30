using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Healthy",
            application = "EventManagement.API",
            checkedAtUtc = DateTime.UtcNow
        });
    }
}
