namespace Legalix.Application.DTOs;

public record DashboardStatsResponse(
    decimal TotalLegalized,
    decimal AvailableBudget,
    int PendingExpenses,
    int ActiveUsers,
    List<SpendingTrendItem> SpendingTrend,
    List<RecentActivityItem> RecentActivity,
    List<TaxEventSummary> UpcomingTaxes
);

public record SpendingTrendItem(string Month, decimal Value);

public record RecentActivityItem(
    string UserFullName, 
    string Action, 
    decimal Amount, 
    DateTime Time, 
    string CompanyName
);

public record TaxEventSummary(
    string Title, 
    DateTime DueDate, 
    string Status
);
