using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Legalix.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public NotificationService(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    public async Task SendNotificationAsync(Guid userId, string title, string message, NotificationType type, string? actionUrl = null)
    {
        var companyId = _tenantProvider.GetTenantId();
        
        var notification = new Notification
        {
            UserId = userId,
            CompanyId = companyId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            ActionUrl = actionUrl
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // TODO: Send Email
        Console.WriteLine($"[EMAIL MOCK] To: {userId}, Topic: {title}, Content: {message}");
        
        // TODO: Trigger Toast (SignalR or similar)
        Console.WriteLine($"[TOAST MOCK] Title: {title}");
    }

    public async Task NotifyLeaderOfNewExpenseAsync(Guid leaderId, string employeeName, decimal amount)
    {
        await SendNotificationAsync(
            leaderId, 
            "notifications.newExpenseTitle", 
            $"notifications.newExpenseMsg|name:{employeeName}|amount:{amount:C}", 
            NotificationType.Activity,
            "/approvals"
        );
    }

    public async Task NotifyEmployeeOfExpenseStatusAsync(Guid employeeId, string expenseTitle, string status, string? comment = null)
    {
        // status comes as "Aprobado" or "Rechazado" from the controller usually, or literal.
        // We'll map it to a translation key.
        string statusKey = status.ToLower().Contains("aprob") ? "common.approved" : "common.rejected";
        
        string title = $"notifications.expenseStatusTitle|status:{statusKey}";
        string message = string.IsNullOrEmpty(comment) 
            ? $"notifications.expenseStatusMsg|title:{expenseTitle}|status:{statusKey}"
            : $"notifications.expenseStatusWithReasonMsg|title:{expenseTitle}|status:{statusKey}|reason:{comment}";

        await SendNotificationAsync(
            employeeId, 
            title, 
            message, 
            statusKey == "common.approved" ? NotificationType.Success : NotificationType.Error,
            null
        );
    }

    public async Task<List<Notification>> GetNotificationsAsync(Guid userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<Guid?> GetExpenseApproverIdAsync(Guid employeeId)
    {
        var employee = await _context.Users
            .Include(u => u.ReportsTo)
            .FirstOrDefaultAsync(u => u.Id == employeeId);

        if (employee == null) return null;

        // 1. Check ReportsTo
        Guid? leaderId = employee.ReportsToId;

        // 2. Check Department Manager
        if (!leaderId.HasValue && employee.DepartmentId.HasValue)
        {
            var department = await _context.Departments.FindAsync(employee.DepartmentId);
            leaderId = department?.ManagerId;
        }

        // LAST RESORT: If still no leader, find an Admin or SuperAdmin in the company
        if (!leaderId.HasValue)
        {
            var adminRoleId = (await _context.Roles.FirstOrDefaultAsync(r => r.Name == "TenantAdmin"))?.Id;
            var superAdminRoleId = (await _context.Roles.FirstOrDefaultAsync(r => r.Name == "SuperAdmin"))?.Id;

            leaderId = await _context.Users
                .Where(u => u.CompanyId == employee.CompanyId && !u.IsDeleted)
                .Where(u => _context.UserRoles.Any(ur => ur.UserId == u.Id && (ur.RoleId == adminRoleId || ur.RoleId == superAdminRoleId)))
                .Select(u => (Guid?)u.Id)
                .FirstOrDefaultAsync();
        }

        return leaderId;
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();
        
        foreach (var n in unread) n.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }
}
