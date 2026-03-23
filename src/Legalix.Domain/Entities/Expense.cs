namespace Legalix.Domain.Entities;

public enum ExpenseStatus
{
    Pending,
    Approved,
    Rejected,
    RequiresCorrection
}

public class Expense : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    // OCR Extracted Data
    public string? Nit { get; set; }
    public string? RazonSocial { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public string? InvoiceNumber { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxAmount { get; set; } // IVA
    public string? Category { get; set; } // e.g., Alimentación, Transporte, Alojamiento
    
    // Validation Data
    public string? Cufe { get; set; }
    public bool IsDeductible { get; set; }
    
    public ExpenseStatus Status { get; set; } = ExpenseStatus.Pending;
    public string? AdminComment { get; set; }
    
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
