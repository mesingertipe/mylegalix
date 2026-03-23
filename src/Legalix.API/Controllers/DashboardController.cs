using Legalix.Application.Common.Interfaces;
using Legalix.Application.DTOs;
using Legalix.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Legalix.Infrastructure.Persistence;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;

    public DashboardController(IDashboardService dashboardService, UserManager<User> userManager, ApplicationDbContext context)
    {
        _dashboardService = dashboardService;
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsResponse>> GetStats()
    {
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        var currentUserId = Guid.Parse(currentUserIdStr);

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";

        var stats = await _dashboardService.GetDashboardStatsAsync(user, role);
        return Ok(stats);
    }
}
