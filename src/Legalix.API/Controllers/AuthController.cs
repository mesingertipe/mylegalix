using Legalix.Application.DTOs;
using Legalix.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Legalix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request);
        return Ok(new { message = "Se ha enviado un correo de recuperación si la cuenta existe." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request);
        if (!result) return BadRequest(new { message = "Token inválido o expirado." });
        return Ok(new { message = "Contraseña actualizada exitosamente." });
    }

    [Authorize]
    [HttpPost("2fa/setup")]
    public async Task<IActionResult> Setup2FA()
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        var secret = await _authService.Generate2FASecretAsync(userId);
        return Ok(new { secret });
    }

    [Authorize]
    [HttpPost("2fa/verify")]
    public async Task<IActionResult> Verify2FA([FromBody] string code)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        return await _authService.Verify2FASecretAsync(userId, code) ? Ok() : BadRequest(new { message = "Código inválido" });
    }

    [Authorize]
    [HttpPost("2fa/toggle")]
    public async Task<IActionResult> Toggle2FA([FromBody] bool enable)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
        return await _authService.Toggle2FAAsync(userId, enable) ? Ok() : BadRequest();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
            var result = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            return result ? Ok(new { message = "Contraseña actualizada correctamente" }) : BadRequest();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("recovery/verify")]
    public async Task<IActionResult> VerifyRecovery([FromBody] RecoveryVerifyRequest request)
    {
        var result = await _authService.VerifyRecoveryAsync(request.Email, request.NationalId);
        return result ? Ok(new { message = "Identidad verificada" }) : BadRequest(new { message = "Los datos no coinciden" });
    }

    [HttpPost("recovery/reset")]
    public async Task<IActionResult> ResetRecovery([FromBody] RecoveryResetRequest request)
    {
        try
        {
            var result = await _authService.ResetPasswordWithRecoveryAsync(request.Email, request.NationalId, request.NewPassword);
            return result ? Ok(new { message = "Contraseña restablecida correctamente" }) : BadRequest(new { message = "Error al restablecer contraseña" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
