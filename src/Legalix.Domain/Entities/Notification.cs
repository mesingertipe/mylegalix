namespace Legalix.Domain.Entities;

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error,
    Activity
}

public class Notification : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }
}
