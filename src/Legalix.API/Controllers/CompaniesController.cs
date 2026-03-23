using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/companies")]
public class CompaniesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public CompaniesController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll()
    {
        var companies = await _context.Companies
            .IgnoreQueryFilters()
            .Select(c => new { 
                c.Id, 
                c.Name, 
                c.Nit, 
                c.Address, 
                c.Country, 
                c.CurrencyCode, 
                c.TimeZone, 
                c.Language, 
                c.IsDeleted,
                c.DailyExpenseLimit,
                c.StrictFiscalValidation,
                c.RetroactiveExpensesDays,
                c.Require2FA,
                c.MultiLanguageOcr
            })
            .ToListAsync();
            
        return Ok(companies);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CompanyDto dto)
    {
        var company = new Company
        {
            Name = dto.Name,
            Nit = dto.Nit,
            Address = dto.Address,
            Country = dto.Country ?? "Colombia",
            CurrencyCode = dto.CurrencyCode ?? "COP",
            TimeZone = dto.TimeZone ?? "SA Pacific Standard Time",
            Language = dto.Language ?? "es-CO",
            DailyExpenseLimit = dto.DailyExpenseLimit > 0 ? dto.DailyExpenseLimit : 800000,
            StrictFiscalValidation = dto.StrictFiscalValidation,
            RetroactiveExpensesDays = dto.RetroactiveExpensesDays > 0 ? dto.RetroactiveExpensesDays : 5,
            Require2FA = dto.Require2FA,
            MultiLanguageOcr = dto.MultiLanguageOcr
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = company.Id }, company);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CompanyDto dto)
    {
        var company = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id);
        if (company == null) return NotFound();

        company.Name = dto.Name;
        company.Nit = dto.Nit;
        company.Address = dto.Address;
        company.Country = dto.Country ?? company.Country;
        company.CurrencyCode = dto.CurrencyCode ?? company.CurrencyCode;
        company.TimeZone = dto.TimeZone ?? company.TimeZone;
        company.Language = dto.Language ?? company.Language;
        company.DailyExpenseLimit = dto.DailyExpenseLimit;
        company.StrictFiscalValidation = dto.StrictFiscalValidation;
        company.RetroactiveExpensesDays = dto.RetroactiveExpensesDays;
        company.Require2FA = dto.Require2FA;
        company.MultiLanguageOcr = dto.MultiLanguageOcr;
        company.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(company);
    }

    [HttpPatch("{id}/toggle-status")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> ToggleStatus(Guid id)
    {
        var company = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id);
        if (company == null) return NotFound();

        company.IsDeleted = !company.IsDeleted;
        company.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { company.Id, company.IsDeleted });
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var tenantId = _tenantProvider.GetTenantId();
        
        var company = await _context.Companies
            .IgnoreQueryFilters()
            .Where(c => c.Id == tenantId)
            .FirstOrDefaultAsync();

        if (company == null) 
        {
            return NotFound($"Empresa no encontrada para el Tenant actual ({tenantId}).");
        }

        var settings = new CompanySettingsDto
        {
            DailyExpenseLimit = company.DailyExpenseLimit,
            StrictFiscalValidation = company.StrictFiscalValidation,
            RetroactiveExpensesDays = company.RetroactiveExpensesDays,
            Require2FA = company.Require2FA,
            MultiLanguageOcr = company.MultiLanguageOcr,
            CurrencyCode = company.CurrencyCode,
            Language = company.Language,
            Country = company.Country,
            TimeZone = company.TimeZone
        };

        return Ok(settings);
    }

    [HttpPatch("settings")]
    [Authorize(Policy = "TenantAdminOrAbove")]
    public async Task<IActionResult> UpdateSettings([FromBody] CompanySettingsDto dto)
    {
        var tenantId = _tenantProvider.GetTenantId();
        var company = await _context.Companies
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == tenantId);

        if (company == null) return NotFound();

        company.DailyExpenseLimit = dto.DailyExpenseLimit;
        company.StrictFiscalValidation = dto.StrictFiscalValidation;
        company.RetroactiveExpensesDays = dto.RetroactiveExpensesDays;
        company.Require2FA = dto.Require2FA;
        company.MultiLanguageOcr = dto.MultiLanguageOcr;
        company.CurrencyCode = dto.CurrencyCode;
        company.Language = dto.Language;
        company.Country = dto.Country ?? company.Country;
        company.TimeZone = dto.TimeZone ?? company.TimeZone;
        company.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        return Ok(new CompanySettingsDto
        {
            DailyExpenseLimit = company.DailyExpenseLimit,
            StrictFiscalValidation = company.StrictFiscalValidation,
            RetroactiveExpensesDays = company.RetroactiveExpensesDays,
            Require2FA = company.Require2FA,
            MultiLanguageOcr = company.MultiLanguageOcr,
            CurrencyCode = company.CurrencyCode,
            Language = company.Language,
            Country = company.Country,
            TimeZone = company.TimeZone
        });
    }
}

public class CompanySettingsDto
{
    [JsonPropertyName("dailyExpenseLimit")]
    public decimal DailyExpenseLimit { get; set; }

    [JsonPropertyName("strictFiscalValidation")]
    public bool StrictFiscalValidation { get; set; }

    [JsonPropertyName("retroactiveExpensesDays")]
    public int RetroactiveExpensesDays { get; set; }

    [JsonPropertyName("require2FA")]
    public bool Require2FA { get; set; }

    [JsonPropertyName("multiLanguageOcr")]
    public bool MultiLanguageOcr { get; set; }

    [JsonPropertyName("currencyCode")]
    public string CurrencyCode { get; set; } = "COP";

    [JsonPropertyName("language")]
    public string Language { get; set; } = "es-CO";

    [JsonPropertyName("country")]
    public string Country { get; set; } = "Colombia";

    [JsonPropertyName("timeZone")]
    public string TimeZone { get; set; } = "SA Pacific Standard Time";
}

public class CompanyDto
{
    public string Name { get; set; } = string.Empty;
    public string Nit { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Country { get; set; }
    public string? CurrencyCode { get; set; }
    public string? TimeZone { get; set; }
    public string? Language { get; set; }
    
    // Business Settings
    public decimal DailyExpenseLimit { get; set; }
    public bool StrictFiscalValidation { get; set; }
    public int RetroactiveExpensesDays { get; set; }
    public bool Require2FA { get; set; }
    public bool MultiLanguageOcr { get; set; }
}
