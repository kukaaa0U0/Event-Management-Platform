using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EventManagement.Infrastructure.Persistence.Configurations;

internal sealed class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");

        builder.HasKey(ticket => ticket.Id);

        builder.Property(ticket => ticket.Id)
            .HasConversion(id => id.Value, value => new TicketId(value))
            .ValueGeneratedNever();

        builder.Property(ticket => ticket.EventId)
            .HasConversion(id => id.Value, value => new EventId(value))
            .IsRequired();

        builder.Property(ticket => ticket.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(ticket => ticket.Type)
            .HasConversion(type => type.ToString(), value => Enum.Parse<TicketType>(value))
            .HasMaxLength(30)
            .IsRequired();

        builder.OwnsOne(ticket => ticket.Price, money =>
        {
            money.Property(value => value.Amount)
                .HasColumnName("price_amount")
                .HasPrecision(18, 2)
                .IsRequired();

            money.Property(value => value.Currency)
                .HasColumnName("price_currency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.Property(ticket => ticket.Capacity)
            .IsRequired();
    }
}
