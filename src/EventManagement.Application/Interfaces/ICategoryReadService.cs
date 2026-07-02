using EventManagement.Application.DTOs;

namespace EventManagement.Application.Interfaces;

public interface ICategoryReadService
{
    Task<IReadOnlyCollection<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);
}
