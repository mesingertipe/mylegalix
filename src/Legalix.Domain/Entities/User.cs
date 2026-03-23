using Microsoft.AspNetCore.Identity;

namespace Legalix.Domain.Entities;

public class User : IdentityUser<Guid>, IMultitenant
{
    public string FullName { get; set; } = string.Empty;
    public string? EmployeeCode { get; set; }
    public string? NationalId { get; set; }
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
    
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    public Guid? VirtualCardId { get; set; }
    public VirtualCard? VirtualCard { get; set; }
    
    public Guid? ReportsToId { get; set; }
    public User? ReportsTo { get; set; }
    
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public decimal MonthlyBudget { get; set; }
    public bool IsDeleted { get; set; }
    public bool RequirePasswordChange { get; set; } = false;
}

public class Role : IdentityRole<Guid>
{
}
