using System.ComponentModel.DataAnnotations;

namespace Legalix.Domain.Entities;

public class ApiKey : BaseEntity, IMultitenant
{
    [Required]
    public string Key { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public DateTime? LastUsedAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public Guid CompanyId { get; set; }
    public Company? Company { get; set; }
}
