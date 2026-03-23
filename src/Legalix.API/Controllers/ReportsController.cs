using System.Text;
using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Legalix.API.Controllers;

[Authorize(Policy = "AreaLeaderOrAbove")]
[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public ReportsController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportToCsv([FromQuery] int? month, [FromQuery] int? year)
    {
        var query = _context.Expenses
            .Include(e => e.User)
            .Where(e => e.Status == ExpenseStatus.Approved);

        if (month.HasValue) query = query.Where(e => e.InvoiceDate.HasValue && e.InvoiceDate.Value.Month == month.Value);
        if (year.HasValue) query = query.Where(e => e.InvoiceDate.HasValue && e.InvoiceDate.Value.Year == year.Value);

        var expenses = await query.ToListAsync();

        var builder = new StringBuilder();
        builder.AppendLine("Fecha,Establecimiento,NIT,Empleado,Categoria,Total,Impuestos,Deducible,CUFE");

        foreach (var e in expenses)
        {
            builder.AppendLine($"{e.InvoiceDate?.ToString("yyyy-MM-dd")},{e.RazonSocial},{e.Nit},{e.User?.FullName},{e.Category},{e.TotalAmount},{e.TaxAmount},{(e.IsDeductible ? "SI" : "NO")},{e.Cufe}");
        }

        return File(Encoding.UTF8.GetBytes(builder.ToString()), "text/csv", $"Reporte_Gastos_{month}_{year}.csv");
    }

    [HttpGet("analytics/spending-by-department")]
    public async Task<IActionResult> GetSpendingByDepartment()
    {
        var stats = await _context.Departments
            .Select(d => new 
            {
                DepartmentName = d.Name,
                MonthlyBudget = d.MonthlyBudget,
                TotalSpent = _context.Expenses
                    .Where(e => e.User!.DepartmentId == d.Id && e.Status == ExpenseStatus.Approved && e.CreatedAt.Month == DateTime.UtcNow.Month)
                    .Sum(e => e.TotalAmount)
            })
            .ToListAsync();

        return Ok(stats);
    }

    [HttpGet("analytics/spending-by-category")]
    public async Task<IActionResult> GetSpendingByCategory()
    {
        var stats = await _context.Expenses
            .Where(e => e.Status == ExpenseStatus.Approved && e.CreatedAt.Month == DateTime.UtcNow.Month)
            .GroupBy(e => e.Category ?? "Otros")
            .Select(g => new 
            {
                Category = g.Key,
                Total = g.Sum(e => e.TotalAmount)
            })
            .ToListAsync();

        return Ok(stats);
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs()
    {
        var logs = await _context.TransactionAudits
            .Include(a => a.VirtualCard)
            .ThenInclude(c => c!.User)
            .OrderByDescending(a => a.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(logs);
    }
}
