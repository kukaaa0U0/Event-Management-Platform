using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EventManagement.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    private static readonly UserId OrganizerId = new(Guid.Parse("5c5b13f0-b64c-4b40-9bfd-6b2e0dbe39a1"));
    private static readonly EventCategoryId TechCategoryId = new(Guid.Parse("a4e4ac80-313c-4ca0-a6f5-3646eac50766"));
    private static readonly EventCategoryId EducationCategoryId = new(Guid.Parse("4e9c390f-48d7-446f-9804-b5ad55d84f6d"));

    public static async Task MigrateAndSeedDatabaseAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await dbContext.Database.MigrateAsync();
        await SeedAsync(dbContext);
    }

    private static async Task SeedAsync(ApplicationDbContext dbContext)
    {
        if (await dbContext.Events.AnyAsync())
        {
            return;
        }

        var organizer = new User(
            OrganizerId,
            "Kirill Organizer",
            Email.Create("organizer@example.com"),
            UserRole.Organizer);

        var techCategory = new EventCategory(TechCategoryId, "Technology");
        var educationCategory = new EventCategory(EducationCategoryId, "Education");

        var meetup = new Event(
            new EventId(Guid.Parse("9bcf9c70-6ab3-4f71-a3d1-a53d9718eb63")),
            OrganizerId,
            TechCategoryId,
            "Student Tech Meetup",
            EventDescription.Create("Introductory meetup for students interested in web development."),
            EventLocation.Create("Moscow", "University campus, building 2", "Main auditorium"),
            DateTime.UtcNow.AddDays(14),
            DateTime.UtcNow.AddDays(14).AddHours(3));

        meetup.Publish();
        meetup.AddTicket(new Ticket(
            new TicketId(Guid.Parse("882a79a7-71f5-4fd8-8df8-a59dc6e3d731")),
            meetup.Id,
            "Regular",
            TicketType.Regular,
            Money.Create(0),
            120));

        var workshop = new Event(
            new EventId(Guid.Parse("143179b1-0e32-44f1-b567-15de88c9a7e4")),
            OrganizerId,
            EducationCategoryId,
            "Backend Workshop",
            EventDescription.Create("Practical workshop about ASP.NET Core Web API and PostgreSQL."),
            EventLocation.Create("Moscow", "Coworking Hall", "Room 4"),
            DateTime.UtcNow.AddDays(30),
            DateTime.UtcNow.AddDays(30).AddHours(4));

        workshop.AddTicket(new Ticket(
            new TicketId(Guid.Parse("5243b9e7-3bdc-4ba7-99e1-c42cf761b2e9")),
            workshop.Id,
            "Early Bird",
            TicketType.EarlyBird,
            Money.Create(1500),
            40));

        await dbContext.Users.AddAsync(organizer);
        await dbContext.EventCategories.AddRangeAsync(techCategory, educationCategory);
        await dbContext.Events.AddRangeAsync(meetup, workshop);
        await dbContext.SaveChangesAsync();
    }
}
