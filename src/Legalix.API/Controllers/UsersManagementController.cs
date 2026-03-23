using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/users-management")]
public class UsersManagementController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public UsersManagementController(
        UserManager<User> userManager, 
        RoleManager<Role> roleManager,
        ApplicationDbContext context,
        ITenantProvider tenantProvider)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    [Authorize] // Allow all authenticated users, filter logic inside
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var isSuperAdmin = User.IsInRole("SuperAdmin");
            var currentTenantId = _tenantProvider.GetTenantId();

            var currentUserId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
            var isTenantAdmin = User.IsInRole("TenantAdmin");

            var usersQuery = _context.Users
                .IgnoreQueryFilters()
                .Include(u => u.Company)
                .Include(u => u.Department)
                .AsQueryable();

            if (isSuperAdmin)
            {
                var adminRole = await _roleManager.Roles.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(r => r.Name == "SuperAdmin");
                var adminRoleId = adminRole?.Id;

                // SuperAdmin sees users of the current tenant PLUS all SuperAdmin users (global)
                usersQuery = usersQuery.Where(u => u.CompanyId == currentTenantId || 
                    _context.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == adminRoleId));
            }
            else if (isTenantAdmin)
            {
                usersQuery = usersQuery.Where(u => u.CompanyId == currentTenantId);
            }
            else
            {
                // Check if current user is a manager of any department
                var managedDeptIds = await _context.Departments
                    .Where(d => d.ManagerId == currentUserId)
                    .Select(d => d.Id)
                    .ToListAsync();

                if (managedDeptIds.Any())
                {
                    // Area Leader: Only see users in their departments
                    usersQuery = usersQuery.Where(u => u.DepartmentId != null && managedDeptIds.Contains(u.DepartmentId.Value));
                }
                else
                {
                    // Regular user: Only see themselves
                    usersQuery = usersQuery.Where(u => u.Id == currentUserId);
                }
            }

            var users = await usersQuery.ToListAsync();
            var result = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new
                {
                    user.Id,
                    user.Email,
                    user.FullName,
                    user.CompanyId,
                    CompanyName = user.Company?.Name ?? "N/A",
                    user.IsDeleted,
                    user.MonthlyBudget,
                    user.DepartmentId,
                    DepartmentName = user.Department?.Name ?? "N/A",
                    nationalId = user.NationalId,
                    Role = roles.FirstOrDefault() ?? "Usuario",
                    TwoFactorEnabled = user.TwoFactorEnabled,
                    user.ReportsToId
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR in UsersManagement.GetAll: {ex}");
            return StatusCode(500, new { message = ex.Message, detail = ex.ToString() });
        }
    }

    [HttpPost]
    [Authorize(Policy = "TenantAdminOrAbove")]
    public async Task<IActionResult> Create([FromBody] UserCreateDto dto)
    {
        var isSuperAdmin = User.IsInRole("SuperAdmin");
        var currentContextTenantId = _tenantProvider.GetTenantId();
        
        // Shielding: If positioned in a tenant, use that one. 
        // Otherwise, use the one from the DTO (for SuperAdmin global management).
        var currentTenantId = _tenantProvider.GetTenantId();
        var targetCompanyId = (isSuperAdmin && currentTenantId != Guid.Empty)
            ? currentTenantId
            : (isSuperAdmin ? dto.CompanyId : currentTenantId);

        if (targetCompanyId == Guid.Empty)
            return BadRequest("Debe seleccionar una empresa o estar posicionado en una para crear usuarios.");

        // Unique Validation per Tenant
        var existingUser = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.CompanyId == targetCompanyId && (u.Email == dto.Email || u.NationalId == dto.NationalId));

        if (existingUser != null)
        {
            if (existingUser.Email == dto.Email)
                return BadRequest(new { message = "El correo electrónico ya está registrado en esta empresa." });
            
            if (existingUser.NationalId == dto.NationalId)
                return BadRequest(new { message = "El ID Nacional ya está registrado en esta empresa." });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            NationalId = dto.NationalId,
            CompanyId = targetCompanyId,
            DepartmentId = dto.DepartmentId,
            MonthlyBudget = dto.MonthlyBudget,
            ReportsToId = dto.ReportsToId,
            EmailConfirmed = true,
            IsDeleted = false,
            RequirePasswordChange = dto.RequirePasswordChange
        };

        var result = await _userManager.CreateAsync(user, dto.Password ?? "Legalix2024*");
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        if (!string.IsNullOrEmpty(dto.Role))
        {
            await _userManager.AddToRoleAsync(user, dto.Role);
        }
        else
        {
            await _userManager.AddToRoleAsync(user, "User");
        }

        return Ok(new { user.Id, user.Email, user.FullName });
    }

    [HttpPut("{id}")]
    [Authorize] // Allow Managers too
    public async Task<IActionResult> Update(Guid id, [FromBody] UserUpdateDto dto)
    {
        var isSuperAdmin = User.IsInRole("SuperAdmin");
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        var currentUserId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        var isTenantAdmin = User.IsInRole("TenantAdmin");

        // Security check
        if (!isSuperAdmin)
        {
            if (isTenantAdmin)
            {
                if (user.CompanyId != _tenantProvider.GetTenantId()) return Forbid();
            }
            else
            {
                // Area Leader Check: Is the user in a department managed by the current user?
                var isManagedByMe = await _context.Departments
                    .AnyAsync(d => d.Id == user.DepartmentId && d.ManagerId == currentUserId);
                if (!isManagedByMe) return Forbid();

                // Managers can ONLY update budget and maybe basic info, but NOT roles or departments
                user.MonthlyBudget = dto.MonthlyBudget;
                // Basic info allowed for team members? Maybe just budget as requested.
                await _userManager.UpdateAsync(user);
                return Ok(user);
            }
        }

        // Unique Validation per Tenant (excluding current user)
        var duplicate = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id != id && u.CompanyId == user.CompanyId && (u.Email == dto.Email || u.NationalId == dto.NationalId));

        if (duplicate != null)
        {
            if (duplicate.Email == dto.Email)
                return BadRequest(new { message = "El correo electrónico ya pertenece a otro usuario de esta empresa." });
            
            if (duplicate.NationalId == dto.NationalId)
                return BadRequest(new { message = "El ID Nacional ya pertenece a otro usuario de esta empresa." });
        }

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.UserName = dto.Email;
        user.NationalId = dto.NationalId;
        user.DepartmentId = dto.DepartmentId;
        user.MonthlyBudget = dto.MonthlyBudget;
        user.ReportsToId = dto.ReportsToId;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        // Update Password if provided
        if (!string.IsNullOrEmpty(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, token, dto.Password);
            if (!resetResult.Succeeded) return BadRequest(resetResult.Errors);
        }

        user.RequirePasswordChange = dto.RequirePasswordChange;
        await _userManager.UpdateAsync(user);

        if (!string.IsNullOrEmpty(dto.Role))
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        return Ok(user);
    }

    [HttpPatch("{id}/toggle-status")]
    [Authorize(Policy = "TenantAdminOrAbove")]
    public async Task<IActionResult> ToggleStatus(Guid id)
    {
        var isSuperAdmin = User.IsInRole("SuperAdmin");
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        if (!isSuperAdmin && user.CompanyId != _tenantProvider.GetTenantId())
            return Forbid();

        user.IsDeleted = !user.IsDeleted;
        await _userManager.UpdateAsync(user);

        return Ok(new { user.Id, user.IsDeleted });
    }
}

public class UserCreateDto
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public Guid CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public decimal MonthlyBudget { get; set; }
    public string? Password { get; set; }
    public string? NationalId { get; set; }
    public bool RequirePasswordChange { get; set; }
    public Guid? ReportsToId { get; set; }
}

public class UserUpdateDto
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Role { get; set; }
    public Guid? DepartmentId { get; set; }
    public decimal MonthlyBudget { get; set; }
    public string? NationalId { get; set; }
    public string? Password { get; set; }
    public bool RequirePasswordChange { get; set; }
    public Guid? ReportsToId { get; set; }
}
