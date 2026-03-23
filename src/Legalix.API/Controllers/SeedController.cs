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

        // Use the centralized SeedAsync from Infrastructure
        await DbInitializer.SeedAsync(_context, _userManager, _roleManager);

        return Ok("Entorno de validación recreado con éxito. Contraseña para todos: Legalix2024* - ID Nacional: 12345678");
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
