using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Legalix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;

    public SeedController(ApplicationDbContext context, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpPost("setup-test-data")]
    public async Task<IActionResult> SetupTestData()
    {
        // 0. Ensure Database Schema exists
        await _context.Database.MigrateAsync();

        // 1. Ensure Roles
        var roles = new[] { "SuperAdmin", "TenantAdmin", "AreaLeader", "Accountant", "User" };
        foreach (var r in roles)
        {
            if (!await _roleManager.RoleExistsAsync(r))
                await _roleManager.CreateAsync(new Role { Id = Guid.NewGuid(), Name = r });
        }

        // 2. Ensure Company
        var company = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Name == "Legalix Demo Corp");
        if (company == null)
        {
            company = new Company
            {
                Id = Guid.NewGuid(),
                Name = "Legalix Demo Corp",
                Nit = "900.111.222-3",
                Address = "Cl. 93 #12-45, Bogotá",
                IsDeleted = false
            };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();
        }

        // 3. Ensure Departments
        var deptVentas = await _context.Departments.IgnoreQueryFilters().FirstOrDefaultAsync(d => d.Name == "Ventas" && d.CompanyId == company.Id);
        if (deptVentas == null)
        {
            deptVentas = new Department { Id = Guid.NewGuid(), Name = "Ventas", CompanyId = company.Id, MonthlyBudget = 10000000 };
            _context.Departments.Add(deptVentas);
        }

        var deptRRHH = await _context.Departments.IgnoreQueryFilters().FirstOrDefaultAsync(d => d.Name == "Recursos Humanos" && d.CompanyId == company.Id);
        if (deptRRHH == null)
        {
            deptRRHH = new Department { Id = Guid.NewGuid(), Name = "Recursos Humanos", CompanyId = company.Id, MonthlyBudget = 5000000 };
            _context.Departments.Add(deptRRHH);
        }
        await _context.SaveChangesAsync();

        // 4. Create Users
        await CreateUser("admin@legalix.com", "Super Administrador", "SuperAdmin", company.Id, null);
        await CreateUser("admin@democorp.com", "Admin Demo Corp", "TenantAdmin", company.Id, null);
        
        var leaderVentas = await CreateUser("lider.ventas@democorp.com", "Laura Líder (Ventas)", "AreaLeader", company.Id, deptVentas.Id);
        var leaderRRHH = await CreateUser("lider.rrhh@democorp.com", "Roberto RRHH", "AreaLeader", company.Id, deptRRHH.Id);
        
        await CreateUser("juan.ventas@democorp.com", "Juan Vendedor", "User", company.Id, deptVentas.Id);
        await CreateUser("ana.ventas@democorp.com", "Ana Asesora", "User", company.Id, deptVentas.Id);
        await CreateUser("pedro.rrhh@democorp.com", "Pedro Reclutador", "User", company.Id, deptRRHH.Id);
        await CreateUser("contador@democorp.com", "Carlos Contador", "Accountant", company.Id, null);

        // Update Dept Managers
        if (leaderVentas != null) deptVentas.ManagerId = leaderVentas.Id;
        if (leaderRRHH != null) deptRRHH.ManagerId = leaderRRHH.Id;
        await _context.SaveChangesAsync();

        return Ok("Entorno de validación recreado con éxito. Contraseña para todos: Legalix2024*");
    }

    [HttpGet("migration-status")]
    public async Task<IActionResult> GetMigrationStatus()
    {
        var applied = await _context.Database.GetAppliedMigrationsAsync();
        var pending = await _context.Database.GetPendingMigrationsAsync();
        var database = _context.Database.GetDbConnection().Database;
        var host = _context.Database.GetDbConnection().DataSource;

        return Ok(new
        {
            Database = database,
            Host = host,
            AppliedMigrations = applied,
            PendingMigrations = pending,
            TotalApplied = applied.Count(),
            TotalPending = pending.Count()
        });
    }

    private async Task<User?> CreateUser(string email, string name, string role, Guid companyId, Guid? deptId)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                FullName = name,
                EmailConfirmed = true,
                CompanyId = companyId,
                DepartmentId = deptId,
                MonthlyBudget = 2000000,
                IsDeleted = false
            };
            await _userManager.CreateAsync(user, "Legalix2024*");
            await _userManager.AddToRoleAsync(user, role);
        }
        else
        {
            user.FullName = name;
            user.DepartmentId = deptId;
            await _userManager.UpdateAsync(user);
        }
        return user;
    }
}
