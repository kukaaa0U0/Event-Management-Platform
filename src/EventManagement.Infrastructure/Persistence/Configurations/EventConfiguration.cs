using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagement.Infrastructure.Persistence.Configurations;

internal sealed class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("events");

        builder.HasKey(eventItem => eventItem.Id);

        builder.Property(eventItem => eventItem.Id)
            .HasConversion(id => id.Value, value => new EventId(value))
            .ValueGeneratedNever();

        builder.Property(eventItem => eventItem.OrganizerId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        builder.Property(eventItem => eventItem.CategoryId)
            .HasConversion(id => id.Value, value => new EventCategoryId(value))
            .IsRequired();

        builder.Property(eventItem => eventItem.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(eventItem => eventItem.Description)
            .HasConversion(description => description.Value, value => EventDescription.Create(value))
            .HasMaxLength(4000)
            .IsRequired();

        builder.OwnsOne(eventItem => eventItem.Location, location =>
        {
            location.Property(value => value.City)
                .HasColumnName("city")
                .HasMaxLength(100)
                .IsRequired();

            location.Property(value => value.Address)
                .HasColumnName("address")
                .HasMaxLength(250)
                .IsRequired();

            location.Property(value => value.VenueName)
                .HasColumnName("venue_name")
                .HasMaxLength(150);
        });

        builder.Property(eventItem => eventItem.StartsAtUtc)
            .IsRequired();

        builder.Property(eventItem => eventItem.EndsAtUtc)
            .IsRequired();

        builder.Property(eventItem => eventItem.Status)
            .HasConversion(status => status.ToString(), value => Enum.Parse<EventStatus>(value))
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(eventItem => eventItem.CreatedAtUtc)
            .IsRequired();

        builder.Property(eventItem => eventItem.UpdatedAtUtc)
            .IsRequired();

        builder.Property(eventItem => eventItem.CalendarSequence)
            .IsRequired();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(eventItem => eventItem.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<EventCategory>()
            .WithMany()
            .HasForeignKey(eventItem => eventItem.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(eventItem => eventItem.Tickets)
            .WithOne()
            .HasForeignKey(ticket => ticket.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(eventItem => eventItem.Tickets)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
