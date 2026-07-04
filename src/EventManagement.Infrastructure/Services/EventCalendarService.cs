using System.Text;
using EventManagement.Application.DTOs;
using EventManagement.Application.Interfaces;

namespace EventManagement.Infrastructure.Services;

public sealed class EventCalendarService : IEventCalendarService
{
    private const string ProductId = "-//Event Management Platform//RU";
    private readonly IEventReadService _eventReadService;

    public EventCalendarService(IEventReadService eventReadService)
    {
        _eventReadService = eventReadService;
    }

    public async Task<EventCalendarFileDto?> GetEventCalendarFileAsync(
        Guid eventId,
        CancellationToken cancellationToken = default)
    {
        var eventDetails = await _eventReadService.GetEventDetailsAsync(eventId, cancellationToken);

        if (eventDetails is null)
        {
            return null;
        }

        var lines = new List<string>
        {
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            $"PRODID:{ProductId}",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            $"UID:{eventDetails.Id}@event-management-platform.local",
            $"DTSTAMP:{FormatUtc(DateTime.UtcNow)}",
            $"DTSTART:{FormatUtc(eventDetails.StartsAtUtc)}",
            $"DTEND:{FormatUtc(eventDetails.EndsAtUtc)}",
            $"SUMMARY:{EscapeText(eventDetails.Title)}",
            $"DESCRIPTION:{EscapeText(eventDetails.Description)}",
            $"LOCATION:{EscapeText(BuildLocation(eventDetails))}",
            $"STATUS:{MapStatus(eventDetails.Status)}",
            "END:VEVENT",
            "END:VCALENDAR"
        };

        var content = string.Join("\r\n", lines.Select(FoldLine)) + "\r\n";

        return new EventCalendarFileDto(
            $"{Slugify(eventDetails.Title)}-{eventDetails.Id:N}.ics",
            content);
    }

    private static string FormatUtc(DateTime value)
    {
        return value.ToUniversalTime().ToString("yyyyMMdd'T'HHmmss'Z'");
    }

    private static string BuildLocation(EventDetailsDto eventDetails)
    {
        return string.Join(
            ", ",
            new[] { eventDetails.City, eventDetails.Address, eventDetails.VenueName }
                .Where(value => !string.IsNullOrWhiteSpace(value)));
    }

    private static string MapStatus(string status)
    {
        return status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase)
            ? "CANCELLED"
            : status.Equals("Draft", StringComparison.OrdinalIgnoreCase)
                ? "TENTATIVE"
                : "CONFIRMED";
    }

    private static string EscapeText(string value)
    {
        return value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace(";", "\\;", StringComparison.Ordinal)
            .Replace(",", "\\,", StringComparison.Ordinal)
            .Replace("\r\n", "\\n", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);
    }

    private static string FoldLine(string line)
    {
        const int maxLength = 73;

        if (line.Length <= maxLength)
        {
            return line;
        }

        var builder = new StringBuilder();
        var remaining = line;

        while (remaining.Length > maxLength)
        {
            builder.Append(remaining[..maxLength]);
            builder.Append("\r\n ");
            remaining = remaining[maxLength..];
        }

        builder.Append(remaining);
        return builder.ToString();
    }

    private static string Slugify(string value)
    {
        var builder = new StringBuilder();

        foreach (var character in value.ToLowerInvariant())
        {
            if (char.IsAsciiLetterOrDigit(character))
            {
                builder.Append(character);
            }
            else if (char.IsWhiteSpace(character) || character is '-' or '_')
            {
                builder.Append('-');
            }
        }

        var slug = builder.ToString().Trim('-');

        return string.IsNullOrWhiteSpace(slug)
            ? "event"
            : slug;
    }
}
