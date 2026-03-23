namespace Legalix.Domain.Entities;

public class VirtualCard : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    public decimal TotalLimit { get; set; }
    public decimal AvailableBalance { get; set; }
    public string Currency { get; set; } = "COP";
    
    public ICollection<TransactionAudit> Audits { get; set; } = new List<TransactionAudit>();
}
