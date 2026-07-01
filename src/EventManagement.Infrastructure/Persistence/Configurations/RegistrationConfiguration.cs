using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagement.Infrastructure.Persistence.Configurations;

internal sealed class RegistrationConfiguration : IEntityTypeConfiguration<Registration>
{
    public void Configure(EntityTypeBuilder<Registration> builder)
    {
        builder.ToTable("registrations");

        builder.HasKey(registration => registration.Id);

        builder.Property(registration => registration.Id)
            .HasConversion(id => id.Value, value => new RegistrationId(value))
            .ValueGeneratedNever();

        builder.Property(registration => registration.EventId)
            .HasConversion(id => id.Value, value => new EventId(value))
            .IsRequired();

        builder.Property(registration => registration.UserId)
            .HasConversion(id => id.Value, value => new UserId(value))
            .IsRequired();

        builder.Property(registration => registration.TicketId)
            .HasConversion(id => id.Value, value => new TicketId(value))
            .IsRequired();

        builder.Property(registration => registration.Status)
            .HasConversion(status => status.ToString(), value => Enum.Parse<RegistrationStatus>(value))
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(registration => registration.CheckInCode)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(registration => registration.CheckInCode)
            .IsUnique();

        builder.HasIndex(registration => new { registration.EventId, registration.UserId })
            .IsUnique();

        builder.Property(registration => registration.CreatedAtUtc)
            .IsRequired();

        builder.HasOne<Event>()
            .WithMany()
            .HasForeignKey(registration => registration.EventId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(registration => registration.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Ticket>()
            .WithMany()
            .HasForeignKey(registration => registration.TicketId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
