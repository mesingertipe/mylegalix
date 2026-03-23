namespace Legalix.Domain.Entities;

public enum TransactionType
{
    Expense,
    Reload,
    Adjustment
}

public class TransactionAudit : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid VirtualCardId { get; set; }
    public VirtualCard? VirtualCard { get; set; }
    
    public decimal Amount { get; set; }
    public decimal PreviousBalance { get; set; }
    public decimal NewBalance { get; set; }
    public TransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    
    // Immutable reference to the expense if applicable
    public Guid? ReferenceId { get; set; }
}
