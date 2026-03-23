namespace Legalix.Domain.Entities;

public class Department : BaseEntity, IMultitenant
{
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyBudget { get; set; }
    
    public Guid? ManagerId { get; set; } // Area Leader
    public User? Manager { get; set; }
    
    public ICollection<User> Employees { get; set; } = new List<User>();
}
