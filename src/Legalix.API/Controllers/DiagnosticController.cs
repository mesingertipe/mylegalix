using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Legalix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Legalix.Application.Common.Interfaces;

namespace Legalix.API.Controllers;

[ApiController]
[Route("api/diagnostic")]
public class DiagnosticController : ControllerBase
{
    private readonly ITenantProvider _tenantProvider;
    private readonly ApplicationDbContext _context;

    public DiagnosticController(ITenantProvider tenantProvider, ApplicationDbContext context)
    {
        _tenantProvider = tenantProvider;
        _context = context;
    }

    [HttpGet("whoami")]
    public IActionResult WhoAmI()
    {
        var user = HttpContext.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;
        var companyIdClaim = user?.FindFirst("CompanyId")?.Value;
        var tenantIdFromProvider = _tenantProvider.GetTenantId();
        var headerTenantId = HttpContext.Request.Headers["X-Tenant-Id"].ToString();

        return Ok(new
        {
            Role = role,
            CompanyIdClaim = companyIdClaim,
            TenantIdFromProvider = tenantIdFromProvider,
            TenantIdFromContext = _context.TenantId,
            HeaderTenantId = headerTenantId,
            UserIsAuthenticated = user?.Identity?.IsAuthenticated ?? false,
            Claims = user?.Claims.Select(c => new { c.Type, c.Value }).ToList()
        });
    }

    [HttpGet("all-departments")]
    public async Task<IActionResult> GetAllDepartments()
    {
        var departments = await _context.Departments
            .IgnoreQueryFilters()
            .Select(d => new { d.Id, d.Name, d.CompanyId })
            .ToListAsync();
        return Ok(departments);
    }
}
