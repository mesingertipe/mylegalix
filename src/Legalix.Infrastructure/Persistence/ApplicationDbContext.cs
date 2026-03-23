using Legalix.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Legalix.Infrastructure.Persistence;
 
public class ApplicationDbContext : IdentityDbContext<User, Role, Guid>
{
    public Guid TenantId => _tenantProvider.GetTenantId();
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<VirtualCard> VirtualCards => Set<VirtualCard>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<TransactionAudit> TransactionAudits => Set<TransactionAudit>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<TaxEvent> TaxEvents => Set<TaxEvent>();
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<FiscalPeriod> FiscalPeriods { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Multitenancy Global Filter
        // We use explicit calls to ensure the lambda capture of '_tenantId' is correct per-request instance.
        SetGlobalQueryFilter<User>(builder);
        SetGlobalQueryFilter<Department>(builder);
        SetGlobalQueryFilter<Expense>(builder);
        SetGlobalQueryFilter<FiscalPeriod>(builder);
        SetGlobalQueryFilter<TaxEvent>(builder);
        SetGlobalQueryFilter<VirtualCard>(builder);
        SetGlobalQueryFilter<ApiKey>(builder);
        SetGlobalQueryFilter<TransactionAudit>(builder);

        // Additional Configurations
        builder.Entity<VirtualCard>()
            .Property(v => v.AvailableBalance)
            .HasPrecision(18, 2);

        builder.Entity<Company>()
            .Property(c => c.DailyExpenseLimit)
            .HasPrecision(18, 2);

        builder.Entity<Expense>()
            .Property(e => e.TotalAmount)
            .HasPrecision(18, 2);
            
        builder.Entity<TransactionAudit>()
            .Property(t => t.Amount)
            .HasPrecision(18, 2);

        // Configure Department Relationships
        builder.Entity<Department>()
            .HasOne(d => d.Manager)
            .WithMany()
            .HasForeignKey(d => d.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<User>()
            .HasOne(u => u.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(u => u.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configure VirtualCard - User (One-to-One)
        builder.Entity<User>()
            .HasOne(u => u.VirtualCard)
            .WithOne(v => v.User)
            .HasForeignKey<User>(u => u.VirtualCardId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private void SetGlobalQueryFilter<T>(ModelBuilder builder) where T : class, IMultitenant
    {
        builder.Entity<T>().HasQueryFilter(e => e.CompanyId == TenantId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var tenantId = TenantId;

        // Try to get tenant's local time if possible
        DateTime localNow = now;
        try 
        {
            if (tenantId != Guid.Empty)
            {
                var company = await Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == tenantId, cancellationToken);
                if (company != null && !string.IsNullOrEmpty(company.TimeZone))
                {
                    var tzi = TimeZoneInfo.FindSystemTimeZoneById(company.TimeZone);
                    localNow = TimeZoneInfo.ConvertTimeFromUtc(now, tzi);
                }
            }
        }
        catch 
        {
            // Fallback to UTC if conversion fails
            localNow = now;
        }

        foreach (var entry in ChangeTracker.Entries<IMultitenant>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CompanyId == Guid.Empty)
            {
                entry.Entity.CompanyId = tenantId;
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = localNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = localNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}

public interface ITenantProvider
{
    Guid GetTenantId();
}
