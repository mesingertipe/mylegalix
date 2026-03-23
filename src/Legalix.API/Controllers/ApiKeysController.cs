using Legalix.Application.DTOs;
using Legalix.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ApiKeysController : ControllerBase
{
    private readonly IApiKeyService _apiKeyService;

    public ApiKeysController(IApiKeyService apiKeyService)
    {
        _apiKeyService = apiKeyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetApiKeys()
    {
        var keys = await _apiKeyService.GetApiKeysAsync();
        return Ok(keys);
    }

    [HttpPost]
    public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request)
    {
        var key = await _apiKeyService.CreateApiKeyAsync(request);
        return Ok(key);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RevokeApiKey(Guid id)
    {
        var result = await _apiKeyService.RevokeApiKeyAsync(id);
        if (!result) return NotFound();
        return Ok();
    }

    [HttpPost("{id}/rotate")]
    public async Task<IActionResult> RotateApiKey(Guid id)
    {
        try
        {
            var rawKey = await _apiKeyService.RotateApiKeyAsync(id);
            return Ok(new { key = rawKey });
        }
        catch (Exception)
        {
            return NotFound();
        }
    }
}
