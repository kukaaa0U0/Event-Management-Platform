using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EventManagement.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    private static readonly UserId OrganizerId = new(Guid.Parse("5c5b13f0-b64c-4b40-9bfd-6b2e0dbe39a1"));
    private static readonly UserId AdminId = new(Guid.Parse("6b91b133-b2a5-47e9-b6d3-570037f4f8e6"));
    private static readonly EventCategoryId TechCategoryId = new(Guid.Parse("a4e4ac80-313c-4ca0-a6f5-3646eac50766"));
    private static readonly EventCategoryId EducationCategoryId = new(Guid.Parse("4e9c390f-48d7-446f-9804-b5ad55d84f6d"));
    private static readonly EventCategoryId CareerCategoryId = new(Guid.Parse("2f60b61a-0f8d-4f2c-bf6a-bfe821ffcb0a"));
    private static readonly EventCategoryId BusinessCategoryId = new(Guid.Parse("d8b1a09d-8802-4dd0-846e-3f11f8a2d740"));
    private static readonly EventCategoryId CultureCategoryId = new(Guid.Parse("7cc08b68-3505-4b03-92f8-749e837bdeaa"));
    private static readonly EventCategoryId SportsCategoryId = new(Guid.Parse("b5ed6357-2c40-4e62-b3cb-35f098ed18a5"));
    private static readonly EventCategoryId ScienceCategoryId = new(Guid.Parse("f3ec8cb7-a92c-46a7-9832-89f5ff3d1320"));
    private static readonly EventCategoryId CommunityCategoryId = new(Guid.Parse("cdc66f4e-0bcb-4f3a-b17f-b6f50ea87f3f"));

    private static readonly (EventCategoryId Id, string Name)[] CategorySeeds =
    [
        (TechCategoryId, "Technology"),
        (EducationCategoryId, "Education"),
        (CareerCategoryId, "Career"),
        (BusinessCategoryId, "Business"),
        (CultureCategoryId, "Culture"),
        (SportsCategoryId, "Sports"),
        (ScienceCategoryId, "Science"),
        (CommunityCategoryId, "Community")
    ];

    public static async Task MigrateAndSeedDatabaseAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await dbContext.Database.MigrateAsync();
        await SeedAsync(dbContext);
    }

    private static async Task SeedAsync(ApplicationDbContext dbContext)
    {
        await SeedCategoriesAsync(dbContext);
        await SeedUsersAsync(dbContext);

        if (await dbContext.Events.AnyAsync())
        {
            return;
        }

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

        await dbContext.Events.AddRangeAsync(meetup, workshop);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedUsersAsync(ApplicationDbContext dbContext)
    {
        var organizerEmail = Email.Create("organizer@example.com");
        var organizerExists = await dbContext.Users
            .AnyAsync(user => user.Id == OrganizerId || user.Email == organizerEmail);

        if (!organizerExists)
        {
            await dbContext.Users.AddAsync(new User(
                OrganizerId,
                "Kirill Organizer",
                organizerEmail,
                UserRole.Organizer));
        }

        var adminEmail = Email.Create("admin@example.com");
        var adminExists = await dbContext.Users
            .AnyAsync(user => user.Id == AdminId || user.Email == adminEmail);

        if (!adminExists)
        {
            await dbContext.Users.AddAsync(new User(
                AdminId,
                "Platform Admin",
                adminEmail,
                UserRole.Admin,
                PasswordHashingService.Hash("Admin123!")));
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedCategoriesAsync(ApplicationDbContext dbContext)
    {
        var existingCategoryIds = await dbContext.EventCategories
            .Select(category => category.Id)
            .ToListAsync();

        var missingCategories = CategorySeeds
            .Where(seed => !existingCategoryIds.Contains(seed.Id))
            .Select(seed => new EventCategory(seed.Id, seed.Name))
            .ToList();

        if (missingCategories.Count == 0)
        {
            return;
        }

        await dbContext.EventCategories.AddRangeAsync(missingCategories);
        await dbContext.SaveChangesAsync();
    }
}
