using Legalix.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Legalix.Infrastructure.Services;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetTenantId()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return Guid.Empty;

        var user = context.User;
        var claimTenantId = user?.FindFirst("CompanyId")?.Value;
        
        // Robust role check
        bool isSuperAdmin = user?.IsInRole("SuperAdmin") ?? false;
        if (!isSuperAdmin)
        {
            // Fallback for different claim formats
            isSuperAdmin = user?.Claims.Any(c => 
                (c.Type == ClaimTypes.Role || c.Type == "role") && 
                string.Equals(c.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase)) ?? false;
        }

        // Always try to get it from header if it's there, but SuperAdmin MUST be allowed to override
        var headerValue = context.Request.Headers["X-Tenant-Id"].ToString();
        if (string.IsNullOrEmpty(headerValue))
        {
            // Try PascalCase just in case
            headerValue = context.Request.Headers["TenantId"].ToString();
        }

        if (!string.IsNullOrEmpty(headerValue) && Guid.TryParse(headerValue, out var tenantId))
        {
            // If it's a SuperAdmin, we always respect the header.
            // If it's a regular user, we only respect the header if it matches their assigned CompanyId (extra safety)
            if (isSuperAdmin)
            {
                return tenantId;
            }
            
            // For non-SuperAdmins, verify the header matches their claim
            if (Guid.TryParse(claimTenantId, out var companyId) && companyId == tenantId)
            {
                return tenantId;
            }
        }

        if (Guid.TryParse(claimTenantId, out var cId))
        {
            return cId;
        }

        return Guid.Empty;
    }
}
