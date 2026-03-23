namespace Legalix.Domain.Entities;

public class Company : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Nit { get; set; } = string.Empty;
    public string? Address { get; set; }
    
    // Globalization
    public string Country { get; set; } = "Colombia";
    public string CurrencyCode { get; set; } = "COP";
    public string TimeZone { get; set; } = "SA Pacific Standard Time";
    public string Language { get; set; } = "es-CO";
    
    // Tenant-Specific Settings
    public decimal DailyExpenseLimit { get; set; } = 800000;
    public bool StrictFiscalValidation { get; set; } = true;
    public int RetroactiveExpensesDays { get; set; } = 5;
    public bool Require2FA { get; set; } = false;
    public bool MultiLanguageOcr { get; set; } = true;

    public ICollection<User> Users { get; set; } = new List<User>();
}
