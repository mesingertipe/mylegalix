namespace RestoHR.Application.Common.Interfaces;

public interface ITenantProvider
{
    Guid GetTenantId();
}
