using EventManagement.Application.Interfaces;
using EventManagement.Domain.Interfaces;
using EventManagement.Infrastructure.Persistence;
using EventManagement.Infrastructure.Persistence.Repositories;
using EventManagement.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace EventManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IEventRepository, EventRepository>();
        services.AddScoped<IRegistrationRepository, RegistrationRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ICategoryReadService, CategoryReadService>();
        services.AddScoped<IEventReadService, EventReadService>();
        services.AddScoped<IEventWriteService, EventWriteService>();
        services.AddScoped<IRegistrationService, RegistrationService>();

        return services;
    }
}
