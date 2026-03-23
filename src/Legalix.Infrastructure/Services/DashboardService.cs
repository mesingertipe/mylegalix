using Legalix.Application.Common.Interfaces;
using Legalix.Application.DTOs;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Legalix.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsResponse> GetDashboardStatsAsync(User user, string role)
    {
        var now = DateTime.UtcNow;
        var firstDayOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // Fetch user manually with IgnoreQueryFilters to avoid authorization issues when a tenant is selected
        var dbUser = await _context.Users.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(u => u.Id == user.Id);
        if (dbUser == null) throw new Exception("User not found");

        bool ignoreFilters = role == "SuperAdmin" && _context.TenantId == Guid.Empty;

        bool isFullView = role == "SuperAdmin" || role == "TenantAdmin" || role == "Accountant";
        bool isAreaLeader = role == "AreaLeader";

        // For AreaLeaders, we filter by their department's users
        var deptUserIds = new List<Guid>();
        if (isAreaLeader && dbUser.DepartmentId.HasValue)
        {
            var userQuery = _context.Users.AsQueryable();
            if (ignoreFilters) userQuery = userQuery.IgnoreQueryFilters();
            
            deptUserIds = await userQuery
                .Where(u => u.DepartmentId == dbUser.DepartmentId)
                .Select(u => u.Id)
                .ToListAsync();
        }

        // 1. Total Legalized (Approved this month)
        var expenseBaseQuery = _context.Expenses.AsQueryable();
        if (ignoreFilters) expenseBaseQuery = expenseBaseQuery.IgnoreQueryFilters();

        var expenseQuery = expenseBaseQuery.Where(e => e.Status == ExpenseStatus.Approved && e.CreatedAt >= firstDayOfMonth);
        
        if (isAreaLeader)
            expenseQuery = expenseQuery.Where(e => deptUserIds.Contains(e.UserId));
        else if (!isFullView)
            expenseQuery = expenseQuery.Where(e => e.UserId == dbUser.Id);

        var totalLegalized = await expenseQuery.SumAsync(e => e.TotalAmount);

        // 2. Budget Calculation
        decimal totalBudget = 0;
        if (isFullView)
        {
            var deptQuery = _context.Departments.AsQueryable();
            if (ignoreFilters) deptQuery = deptQuery.IgnoreQueryFilters();
            totalBudget = await deptQuery.SumAsync(d => d.MonthlyBudget);
        }
        else if (isAreaLeader && dbUser.DepartmentId.HasValue)
        {
            var deptQuery = _context.Departments.AsQueryable();
            if (ignoreFilters) deptQuery = deptQuery.IgnoreQueryFilters();
            totalBudget = await deptQuery.Where(d => d.Id == dbUser.DepartmentId).Select(d => d.MonthlyBudget).FirstOrDefaultAsync();
        }
        else
            totalBudget = dbUser.MonthlyBudget;

        var availableBudget = totalBudget - totalLegalized;

        // 3. Pending Expenses
        var pendingBaseQuery = _context.Expenses.AsQueryable();
        if (ignoreFilters) pendingBaseQuery = pendingBaseQuery.IgnoreQueryFilters();
        var pendingQuery = pendingBaseQuery.Where(e => e.Status == ExpenseStatus.Pending);
        if (isAreaLeader)
            pendingQuery = pendingQuery.Where(e => deptUserIds.Contains(e.UserId));
        else if (!isFullView)
            pendingQuery = pendingQuery.Where(e => e.UserId == dbUser.Id);

        var pendingCount = await pendingQuery.CountAsync();

        // 4. Active Users
        var activeUsersCount = 1;
        if (isFullView)
        {
            var userQuery = _context.Users.AsQueryable();
            if (ignoreFilters) userQuery = userQuery.IgnoreQueryFilters();
            activeUsersCount = await userQuery.CountAsync(u => !u.IsDeleted);
        }
        else if (isAreaLeader && dbUser.DepartmentId.HasValue)
        {
            var userQuery = _context.Users.AsQueryable();
            if (ignoreFilters) userQuery = userQuery.IgnoreQueryFilters();
            activeUsersCount = await userQuery.CountAsync(u => !u.IsDeleted && u.DepartmentId == dbUser.DepartmentId);
        }

        // 5. Spending Trend (Last 6 months)
        var trendItems = new List<SpendingTrendItem>();
        for (int i = 5; i >= 0; i--)
        {
            var monthStart = firstDayOfMonth.AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);
            var monthName = monthStart.ToString("MMM", CultureInfo.InvariantCulture);

            var monthBaseQuery = _context.Expenses.AsQueryable();
            if (ignoreFilters) monthBaseQuery = monthBaseQuery.IgnoreQueryFilters();

            var monthQuery = monthBaseQuery.Where(e => e.Status == ExpenseStatus.Approved && e.CreatedAt >= monthStart && e.CreatedAt < monthEnd);
            
            if (isAreaLeader)
                monthQuery = monthQuery.Where(e => deptUserIds.Contains(e.UserId));
            else if (!isFullView)
                monthQuery = monthQuery.Where(e => e.UserId == dbUser.Id);

            var monthTotal = await monthQuery.SumAsync(e => e.TotalAmount);
            trendItems.Add(new SpendingTrendItem(monthName, monthTotal));
        }

        // 6. Recent Activity (TransactionAudits)
        var auditBaseQuery = _context.TransactionAudits.AsQueryable();
        if (ignoreFilters) auditBaseQuery = auditBaseQuery.IgnoreQueryFilters();

        var auditQuery = auditBaseQuery
            .Include(a => a.VirtualCard)
            .ThenInclude(c => c!.User)
            .OrderByDescending(a => a.CreatedAt);

        var recentAudits = await auditQuery.Take(10).ToListAsync();
        
        var filteredAudits = recentAudits;
        if (isAreaLeader && dbUser.DepartmentId.HasValue)
            filteredAudits = recentAudits.Where(a => a.VirtualCard?.User?.DepartmentId == dbUser.DepartmentId).ToList();
        else if (!isFullView)
            filteredAudits = recentAudits.Where(a => a.VirtualCard?.UserId == dbUser.Id).ToList();

        var activityItems = filteredAudits.Take(5).Select(a => new RecentActivityItem(
            a.VirtualCard?.User?.FullName ?? "Sistema",
            a.Description,
            a.Amount,
            a.CreatedAt,
            isFullView ? (a.VirtualCard?.User?.Department?.Name ?? "General") : ""
        )).ToList();

        // 7. Upcoming Taxes
        var taxBaseQuery = _context.TaxEvents.AsQueryable();
        if (ignoreFilters) taxBaseQuery = taxBaseQuery.IgnoreQueryFilters();

        var upcomingTaxesRaw = await taxBaseQuery
            .Where(t => !t.IsCompleted && t.DueDate >= now.Date)
            .OrderBy(t => t.DueDate)
            .Take(3)
            .ToListAsync();

        var upcomingTaxes = upcomingTaxesRaw.Select(t => new TaxEventSummary(
            t.Title, 
            t.DueDate, 
            (t.DueDate - now.Date).TotalDays <= 3 ? "Urgent" : "Upcoming"
        )).ToList();

        return new DashboardStatsResponse(
            totalLegalized,
            availableBudget,
            pendingCount,
            activeUsersCount,
            trendItems,
            activityItems,
            upcomingTaxes
        );
    }
}
