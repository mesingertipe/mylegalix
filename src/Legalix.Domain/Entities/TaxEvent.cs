namespace Legalix.Domain.Entities;

public class TaxEvent : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurringType { get; set; } // Monthly, Yearly
    
    public string Color { get; set; } = "#6366f1";
    public bool IsFullDay { get; set; } = true;

    public bool IsCompleted { get; set; }
}
