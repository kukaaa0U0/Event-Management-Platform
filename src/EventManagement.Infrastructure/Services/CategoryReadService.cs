using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class CategoryReadService : ICategoryReadService
{
    private readonly ApplicationDbContext _dbContext;

    public CategoryReadService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyCollection<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.EventCategories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .Select(category => new CategoryDto(category.Id.Value, category.Name))
            .ToListAsync(cancellationToken);
    }
}
