using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CategoriesController : ControllerBase
{
    private readonly ICategoryReadService _categoryReadService;

    public CategoriesController(ICategoryReadService categoryReadService)
    {
        _categoryReadService = categoryReadService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<CategoryDto>>> GetCategories(CancellationToken cancellationToken)
    {
        return Ok(await _categoryReadService.GetCategoriesAsync(cancellationToken));
    }
}
