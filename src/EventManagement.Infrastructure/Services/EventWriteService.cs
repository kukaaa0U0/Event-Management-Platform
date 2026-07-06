using EventManagement.Application.Commands;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;
using EventManagement.Domain.Entities;
using EventManagement.Domain.Enums;
using EventManagement.Domain.ValueObjects;
using EventManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventManagement.Infrastructure.Services;

public sealed class EventWriteService : IEventWriteService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IEventReadService _eventReadService;
    private readonly IEventAccessService _eventAccessService;

    public EventWriteService(
        ApplicationDbContext dbContext,
        IEventReadService eventReadService,
        IEventAccessService eventAccessService)
    {
        _dbContext = dbContext;
        _eventReadService = eventReadService;
        _eventAccessService = eventAccessService;
    }

    public async Task<EventDetailsDto?> CreateEventAsync(
        CreateEventCommand command,
        CancellationToken cancellationToken = default)
    {
        var organizerId = new UserId(command.OrganizerId);
        var categoryId = new EventCategoryId(command.CategoryId);

        var categoryExists = await _dbContext.EventCategories
            .AnyAsync(category => category.Id == categoryId, cancellationToken);

        if (!categoryExists)
        {
            return null;
        }

        var organizerExists = await _dbContext.Users
            .AnyAsync(user => user.Id == organizerId, cancellationToken);

        if (!organizerExists)
        {
            throw new InvalidOperationException("Organizer was not found.");
        }

        var eventItem = new Event(
            EventId.New(),
            organizerId,
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

    public async Task<EventDetailsDto?> UpdateEventAsync(
        UpdateEventCommand command,
        CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(command.EventId, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        if (!await _eventAccessService.CanManageEventAsync(
                command.CurrentUserId,
                command.CurrentUserRole,
                command.EventId,
                cancellationToken))
        {
            throw new UnauthorizedAccessException("Only the event organizer or admin can update this event.");
        }

        var categoryId = new EventCategoryId(command.CategoryId);
        var categoryExists = await _dbContext.EventCategories
            .AnyAsync(category => category.Id == categoryId, cancellationToken);

        if (!categoryExists)
        {
            throw new ArgumentException("Category was not found.");
        }

        eventItem.ChangeCategory(categoryId);
        eventItem.UpdateDetails(
            command.Title,
            EventDescription.Create(command.Description),
            EventLocation.Create(command.City, command.Address, command.VenueName),
            EnsureUtc(command.StartsAtUtc),
            EnsureUtc(command.EndsAtUtc));

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(command.EventId, cancellationToken);
    }

    public async Task<EventDetailsDto?> CreateTicketAsync(
        CreateTicketCommand command,
        CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(command.EventId, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        if (!await _eventAccessService.CanManageEventAsync(
                command.CurrentUserId,
                command.CurrentUserRole,
                command.EventId,
                cancellationToken))
        {
            throw new UnauthorizedAccessException("Only the event organizer or admin can add tickets.");
        }

        if (!Enum.TryParse<TicketType>(command.Type, ignoreCase: true, out var ticketType))
        {
            throw new ArgumentException("Ticket type is invalid.");
        }

        var ticket = new Ticket(
            TicketId.New(),
            eventItem.Id,
            command.Name,
            ticketType,
            Money.Create(command.PriceAmount, command.PriceCurrency),
            command.Capacity);

        eventItem.AddTicket(ticket);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(command.EventId, cancellationToken);
    }

    public async Task<EventDetailsDto?> UpdateEventSettingsAsync(
        UpdateEventSettingsCommand command,
        CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(command.EventId, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        if (!await _eventAccessService.CanManageEventAsync(
                command.CurrentUserId,
                command.CurrentUserRole,
                command.EventId,
                cancellationToken))
        {
            throw new UnauthorizedAccessException("Only the event organizer or admin can update event settings.");
        }

        eventItem.UpdateAvailability(command.RegistrationEnabled, command.CheckInEnabled);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(command.EventId, cancellationToken);
    }

    public async Task<EventDetailsDto?> PublishEventAsync(
        Guid id,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(id, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        if (!await _eventAccessService.CanManageEventAsync(currentUserId, currentUserRole, id, cancellationToken))
        {
            throw new UnauthorizedAccessException("Only the event organizer or admin can publish this event.");
        }

        eventItem.Publish();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _eventReadService.GetEventDetailsAsync(id, cancellationToken);
    }

    public async Task<EventDetailsDto?> CancelEventAsync(
        Guid id,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var eventItem = await GetTrackedEventAsync(id, cancellationToken);

        if (eventItem is null)
        {
            return null;
        }

        if (!await _eventAccessService.CanManageEventAsync(currentUserId, currentUserRole, id, cancellationToken))
        {
            throw new UnauthorizedAccessException("Only the event organizer or admin can cancel this event.");
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
