using Legalix.Domain.Entities;

namespace Legalix.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(Guid userId, string title, string message, NotificationType type, string? actionUrl = null);
    Task NotifyLeaderOfNewExpenseAsync(Guid leaderId, string employeeName, decimal amount);
    Task NotifyEmployeeOfExpenseStatusAsync(Guid employeeId, string expenseTitle, string status, string? comment = null);
    Task<List<Notification>> GetNotificationsAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<Guid?> GetExpenseApproverIdAsync(Guid employeeId);
}
