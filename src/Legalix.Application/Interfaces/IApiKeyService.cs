using Legalix.Application.DTOs;

namespace Legalix.Application.Interfaces;

public interface IApiKeyService
{
    Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync();
    Task<ApiKeyDto> CreateApiKeyAsync(CreateApiKeyRequest request);
    Task<bool> RevokeApiKeyAsync(Guid id);
    Task<string> RotateApiKeyAsync(Guid id);
}
