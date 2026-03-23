using Legalix.Domain.Entities;

namespace Legalix.Application.DTOs;

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MarkAsReadRequest
{
    public List<Guid>? NotificationIds { get; set; }
}
