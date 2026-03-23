using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public DepartmentsController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var query = _context.Departments.AsQueryable();

        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdString))
        {
            var userId = Guid.Parse(userIdString);
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var isTenantAdmin = User.IsInRole("TenantAdmin");

            if (!isSuperAdmin && !isTenantAdmin)
            {
                // Area Leader / Regular User: Only see departments they manage
                query = query.Where(d => d.ManagerId == userId);
            }
        }

        var departments = await query
            .Include(d => d.Manager)
            .Select(d => new 
            { 
                d.Id, 
                d.Name, 
                d.MonthlyBudget, 
                d.ManagerId,
                d.CompanyId,
                ManagerName = d.Manager != null ? d.Manager.FullName : "Sin Asignar"
            })
            .ToListAsync();
            
        return Ok(departments);
    }

    [HttpPost]
    [Authorize(Policy = "TenantAdminOrAbove")]
    public async Task<IActionResult> Create([FromBody] DepartmentDto dto)
    {
        var department = new Department
        {
            Name = dto.Name,
            MonthlyBudget = dto.MonthlyBudget,
            ManagerId = dto.ManagerId,
            CompanyId = _tenantProvider.GetTenantId()
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = department.Id }, department);
    }

    [HttpPatch("{id}/budget")]
    public async Task<IActionResult> UpdateBudget(Guid id, [FromBody] UpdateBudgetDto dto)
    {
        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == id);
        if (dept == null) return NotFound();

        // Check if user is Admin OR the Manager of this department
        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();
        
        var userId = Guid.Parse(userIdString);
        var isManager = dept.ManagerId == userId;
        var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("TenantAdmin");

        if (!isAdmin && !isManager)
        {
            return Forbid();
        }

        dept.MonthlyBudget = dto.MonthlyBudget;
        dept.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { dept.Id, dept.MonthlyBudget });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] DepartmentDto dto)
    {
        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == id);
        if (dept == null) return NotFound();

        var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userId = !string.IsNullOrEmpty(userIdString) ? Guid.Parse(userIdString) : Guid.Empty;
        var isManager = dept.ManagerId == userId;
        var isAdmin = User.IsInRole("SuperAdmin") || User.IsInRole("TenantAdmin");

        if (!isAdmin && !isManager) return Forbid();

        if (isAdmin)
        {
            dept.Name = dto.Name;
            dept.ManagerId = dto.ManagerId;
        }
        
        dept.MonthlyBudget = dto.MonthlyBudget;
        dept.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(dept);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "TenantAdminOrAbove")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var dept = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);
                
            if (dept == null) return NotFound();

            // Explicitly nullify employees to avoid constraint issues in some DB providers
            foreach (var employee in dept.Employees)
            {
                employee.DepartmentId = null;
            }

            _context.Departments.Remove(dept);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;
            return BadRequest(new { Message = $"No se pudo eliminar el departamento: {message}" });
        }
    }
}

public class DepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyBudget { get; set; }
    public Guid? ManagerId { get; set; }
}

public class UpdateBudgetDto
{
    public decimal MonthlyBudget { get; set; }
}
