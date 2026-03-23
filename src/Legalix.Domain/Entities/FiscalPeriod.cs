namespace Legalix.Domain.Entities;

public enum PeriodStatus
{
    Open,
    Closed,
    Archived
}

public class FiscalPeriod : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public int Month { get; set; }
    public int Year { get; set; }
    public PeriodStatus Status { get; set; } = PeriodStatus.Open;
    public DateTime OpeningDate { get; set; } = DateTime.UtcNow;
    public DateTime? ClosingDate { get; set; }
    
    public string Name => $"{Month:D2}/{Year}";
}
