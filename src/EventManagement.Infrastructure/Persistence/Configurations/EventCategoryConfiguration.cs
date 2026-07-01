using EventManagement.Domain.Entities;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagement.Infrastructure.Persistence.Configurations;

internal sealed class EventCategoryConfiguration : IEntityTypeConfiguration<EventCategory>
{
    public void Configure(EntityTypeBuilder<EventCategory> builder)
    {
        builder.ToTable("event_categories");

        builder.HasKey(category => category.Id);

        builder.Property(category => category.Id)
            .HasConversion(id => id.Value, value => new EventCategoryId(value))
            .ValueGeneratedNever();

        builder.Property(category => category.Name)
            .HasMaxLength(100)
            .IsRequired();
    }
}
