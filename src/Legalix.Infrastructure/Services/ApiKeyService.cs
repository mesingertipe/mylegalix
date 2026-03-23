using Legalix.Application.DTOs;
using Legalix.Application.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Legalix.Infrastructure.Services;

public class ApiKeyService : IApiKeyService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public ApiKeyService(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    public async Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync()
    {
        return await _context.Set<ApiKey>()
            .Select(k => new ApiKeyDto(k.Id, k.Name, k.Description, null, k.LastUsedAt, k.IsActive))
            .ToListAsync();
    }

    public async Task<ApiKeyDto> CreateApiKeyAsync(CreateApiKeyRequest request)
    {
        var rawKey = GenerateSecureKey();
        var hashedKey = HashKey(rawKey);

        var apiKey = new ApiKey
        {
            Name = request.Name,
            Description = request.Description,
            Key = hashedKey,
            IsActive = true,
            CompanyId = _tenantProvider.GetTenantId()
        };

        _context.Set<ApiKey>().Add(apiKey);
        await _context.SaveChangesAsync();

        return new ApiKeyDto(apiKey.Id, apiKey.Name, apiKey.Description, rawKey, null, true);
    }

    public async Task<bool> RevokeApiKeyAsync(Guid id)
    {
        var key = await _context.Set<ApiKey>().FindAsync(id);
        if (key == null) return false;

        key.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> RotateApiKeyAsync(Guid id)
    {
        var key = await _context.Set<ApiKey>().FindAsync(id);
        if (key == null) throw new Exception("Key not found");

        var rawKey = GenerateSecureKey();
        key.Key = HashKey(rawKey);
        await _context.SaveChangesAsync();

        return rawKey;
    }

    private string GenerateSecureKey()
    {
        var bytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        return "lx_" + Convert.ToBase64String(bytes).Replace("/", "").Replace("+", "").Substring(0, 32);
    }

    private string HashKey(string key)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(key));
            return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
        }
    }
}
