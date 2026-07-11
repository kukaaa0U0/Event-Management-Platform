namespace EventManagement.Application.DTOs;

public sealed record EventSummaryDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Title,
    string Description,
    string City,
    string Address,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string Status);
