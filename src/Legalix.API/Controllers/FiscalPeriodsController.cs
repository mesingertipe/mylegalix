using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Legalix.API.Controllers;

[Authorize(Policy = "TenantAdminOrAbove")]
[ApiController]
[Route("api/[controller]")]
public class FiscalPeriodsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly INotificationService _notificationService;

    public FiscalPeriodsController(
        ApplicationDbContext context, 
        ITenantProvider tenantProvider,
        INotificationService notificationService)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPeriods()
    {
        var periods = await _context.FiscalPeriods
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .ToListAsync();
        return Ok(periods);
    }

    [HttpPost("open")]
    public async Task<IActionResult> OpenPeriod([FromBody] FiscalPeriodDto dto)
    {
        var exists = await _context.FiscalPeriods
            .AnyAsync(p => p.Month == dto.Month && p.Year == dto.Year);
        
        if (exists) return BadRequest("El periodo ya existe.");

        var period = new FiscalPeriod
        {
            CompanyId = _tenantProvider.GetTenantId(),
            Month = dto.Month,
            Year = dto.Year,
            Status = PeriodStatus.Open,
            OpeningDate = DateTime.UtcNow,
            ClosingDate = dto.ClosingDate
        };

        _context.FiscalPeriods.Add(period);
        await _context.SaveChangesAsync();

        return Ok(period);
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> ClosePeriod(Guid id)
    {
        var period = await _context.FiscalPeriods.FindAsync(id);
        if (period == null) return NotFound();

        period.Status = PeriodStatus.Closed;
        period.ClosingDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(period);
    }
}

public class FiscalPeriodDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public DateTime? ClosingDate { get; set; }
}
