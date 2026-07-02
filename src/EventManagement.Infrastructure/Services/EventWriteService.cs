using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Domain.Entities;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class EventWriteService : IEventWriteService
{
    private static readonly UserId DefaultOrganizerId = new(Guid.Parse("5c5b13f0-b64c-4b40-9bfd-6b2e0dbe39a1"));

    private readonly ApplicationDbContext _dbContext;
    private readonly IEventReadService _eventReadService;

    public EventWriteService(ApplicationDbContext dbContext, IEventReadService eventReadService)
    {
        _dbContext = dbContext;
        _eventReadService = eventReadService;
    }

    public async Task<EventDetailsDto?> CreateEventAsync(
        CreateEventCommand command,
        CancellationToken cancellationToken = default)
    {
        var categoryId = new EventCategoryId(command.CategoryId);

        var categoryExists = await _dbContext.EventCategories
            .AnyAsync(category => category.Id == categoryId, cancellationToken);

        if (!categoryExists)
        {
            return null;
        }

        var organizerExists = await _dbContext.Users
            .AnyAsync(user => user.Id == DefaultOrganizerId, cancellationToken);

        if (!organizerExists)
        {
            throw new InvalidOperationException("Default organizer is missing from the database.");
        }

        var eventItem = new Event(
            EventId.New(),
            DefaultOrganizerId,
            categoryId,
            command.Title,
            EventDescription.Create(command.Description),
            EventLocation.Create(command.City, command.Address, command.VenueName),
            EnsureUtc(command.StartsAtUtc),
            EnsureUtc(command.EndsAtUtc));

        await _dbContext.Events.AddAsync(eventItem, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(eventItem.Id.Value, cancellationToken);
    }

    public async Task<EventDetailsDto?> PublishEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(id, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        eventItem.Publish();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(id, cancellationToken);
    }

    public async Task<EventDetailsDto?> CancelEventAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(id, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        eventItem.Cancel();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(id, cancellationToken);
    }

    private async Task<Event?> GetTrackedEventAsync(Guid id, CancellationToken cancellationToken)
    {
        var eventId = new EventId(id);

        return await _dbContext.Events
            .FirstOrDefaultAsync(eventItem => eventItem.Id == eventId, cancellationToken);
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
