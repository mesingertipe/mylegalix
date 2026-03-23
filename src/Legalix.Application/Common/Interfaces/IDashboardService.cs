using Legalix.Application.DTOs;
using Legalix.Domain.Entities;

namespace Legalix.Application.Common.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync(User user, string role);
}
