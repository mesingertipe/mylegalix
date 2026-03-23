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
        try 
        {
            // 0. Ensure Database Schema exists
            await _context.Database.MigrateAsync();

            // Use the centralized SeedAsync from Infrastructure
            await DbInitializer.SeedAsync(_context, _userManager, _roleManager);

            var admin = await _userManager.FindByEmailAsync("admin@legalix.com");
            var hasId = !string.IsNullOrEmpty(admin?.NationalId);

            return Ok(new {
                Message = "Entorno recreado con éxito",
                AdminReset = admin != null,
                NationalIdSet = hasId,
                ExpectedNationalId = "12345678",
                ExpectedPassword = "Legalix2024*",
                RoleVerified = admin != null && await _userManager.IsInRoleAsync(admin, "SuperAdmin")
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message, Stack = ex.StackTrace });
        }
    }

    [HttpGet("force-reset-admin")]
    public async Task<IActionResult> ForceResetAdmin()
    {
        try 
        {
            var adminEmail = "admin@legalix.com";
            var user = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.NormalizedEmail == adminEmail.ToUpperInvariant());
            
            if (user != null)
            {
                // Clear dependencies to avoid FK violations
                var dependents = await _context.Users.Where(u => u.ReportsToId == user.Id).ToListAsync();
                foreach (var d in dependents) d.ReportsToId = null;

                var managedDepts = await _context.Departments.Where(d => d.ManagerId == user.Id).ToListAsync();
                foreach (var d in managedDepts) d.ManagerId = null;

                await _context.SaveChangesAsync();
                await _userManager.DeleteAsync(user);
            }

            var company = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Name == "Legalix HQ" || c.Name == "Legalix Demo Corp");
            if (company == null)
            {
                company = new Company { Id = Guid.NewGuid(), Name = "Legalix Demo Corp", Nit = "123", IsDeleted = false };
                _context.Companies.Add(company);
                await _context.SaveChangesAsync();
            }

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                UserName = adminEmail,
                Email = adminEmail,
                NormalizedEmail = adminEmail.ToUpperInvariant(),
                NormalizedUserName = adminEmail.ToUpperInvariant(),
                FullName = "Admin Super",
                NationalId = "12345678",
                EmailConfirmed = true,
                CompanyId = company.Id,
                IsDeleted = false
            };

            var result = await _userManager.CreateAsync(newUser, "Legalix2024*");
            if (!result.Succeeded) return BadRequest(result.Errors);

            // Add role
            if (!await _roleManager.RoleExistsAsync("SuperAdmin"))
                await _roleManager.CreateAsync(new Role { Id = Guid.NewGuid(), Name = "SuperAdmin" });
            
            await _userManager.AddToRoleAsync(newUser, "SuperAdmin");

            return Ok(new { Message = "ADMIN RECREADO CON ÉXITO", NationalId = "12345678", Password = "Legalix2024*" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("seed-dev")]
    public async Task<IActionResult> SeedDev()
    {
        try 
        {
            var devEmail = "dev@legalix.com";
            var user = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.NormalizedEmail == devEmail.ToUpperInvariant());
            
            if (user == null)
            {
                var hq = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync();
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = devEmail,
                    Email = devEmail,
                    NormalizedEmail = devEmail.ToUpperInvariant(),
                    NormalizedUserName = devEmail.ToUpperInvariant(),
                    FullName = "Dev User",
                    EmailConfirmed = true,
                    CompanyId = hq?.Id ?? Guid.NewGuid(),
                    IsDeleted = false,
                    SecurityStamp = Guid.NewGuid().ToString()
                };
                var createResult = await _userManager.CreateAsync(user, "Legalix2024*");
                if (!createResult.Succeeded) return BadRequest(createResult.Errors);
            }
            else 
            {
                user.PasswordHash = _userManager.PasswordHasher.HashPassword(user, "Legalix2024*");
                user.NormalizedEmail = devEmail.ToUpperInvariant();
                user.NormalizedUserName = devEmail.ToUpperInvariant();
                user.SecurityStamp = Guid.NewGuid().ToString();
                await _userManager.UpdateAsync(user);
            }

            if (!await _roleManager.RoleExistsAsync("SuperAdmin"))
                await _roleManager.CreateAsync(new Role { Id = Guid.NewGuid(), Name = "SuperAdmin" });

            await _userManager.AddToRoleAsync(user, "SuperAdmin");
            
            return Ok(new { 
                Status = "LISTO",
                Email = user.Email,
                NormalizedEmail = user.NormalizedEmail,
                HashLength = user.PasswordHash?.Length,
                Role = "SuperAdmin",
                Password = "Legalix2024*"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message, Trace = ex.StackTrace });
        }
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

}
