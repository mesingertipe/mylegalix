namespace Legalix.Domain.Entities;

public class Attachment : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid? ExpenseId { get; set; }
    public Expense? Expense { get; set; }
    
    public string FileName { get; set; } = string.Empty;
    public string StorageUrl { get; set; } = string.Empty; // Firebase Storage URL
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
}
