using EventManagement.Domain.Entities;
using EventManagement.Infrastructure.Persistence.Configurations;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Event> Events => Set<Event>();

    public DbSet<EventCategory> EventCategories => Set<EventCategory>();

    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DbSet<Registration> Registrations => Set<Registration>();

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new EventConfiguration());
        modelBuilder.ApplyConfiguration(new EventCategoryConfiguration());
        modelBuilder.ApplyConfiguration(new TicketConfiguration());
        modelBuilder.ApplyConfiguration(new RegistrationConfiguration());
        modelBuilder.ApplyConfiguration(new UserConfiguration());
    }
}
