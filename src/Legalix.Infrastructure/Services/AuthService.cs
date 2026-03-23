using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Legalix.Application.Interfaces;
using Legalix.Application.DTOs;
using Legalix.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Legalix.Infrastructure.Persistence;

namespace Legalix.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public AuthService(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.Users
            .Include(u => u.Company)
            .Include(u => u.Department)
            .Include(u => u.ReportsTo)
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == request.Email.ToUpperInvariant());
             
        if (user == null || user.IsDeleted) throw new Exception("Credenciales inválidas");

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        
        bool is2faRequired = result.RequiresTwoFactor || (result.Succeeded && user.TwoFactorEnabled);

        if (is2faRequired)
        {
            if (string.IsNullOrEmpty(request.TwoFactorCode))
                return new LoginResponse("", DateTime.MinValue, "", "", "", "", Guid.Empty, "", Guid.Empty, "COP", "SA Pacific Standard Time", "es-CO", 0, true, false, false, null, null);
            
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(
                user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.TwoFactorCode);
            if (!isValid) throw new Exception("Código 2FA inválido");
        }
        else if (!result.Succeeded)
        {
            throw new Exception("Credenciales inválidas");
        }

        return await GenerateLoginResponse(user);
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == request.Email.ToUpperInvariant());
            
        if (user == null) return true; // Don't reveal user existence

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        // TODO: Send email with token
        Console.WriteLine($"Password Reset Token for {user.Email}: {token}");
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email);
            
        if (user == null) return false;

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        return result.Succeeded;
    }

    public async Task<bool> Toggle2FAAsync(Guid userId, bool enable)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        var result = await _userManager.SetTwoFactorEnabledAsync(user, enable);
        return result.Succeeded;
    }

    public async Task<string> Generate2FASecretAsync(Guid userId)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return string.Empty;

        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        // If it's still null, try to force it by reloading
        if (string.IsNullOrEmpty(key))
        {
             var reloadedUser = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
             key = await _userManager.GetAuthenticatorKeyAsync(reloadedUser!);
        }

        return key ?? string.Empty;
    }

    public async Task<bool> Verify2FASecretAsync(Guid userId, string code)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, code);

        if (isValid)
        {
            await _userManager.SetTwoFactorEnabledAsync(user, true);
        }

        return isValid;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;

        // Validation: Min 8 chars, letter, number, special char
        if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 8)
            throw new Exception("La contraseña debe tener al menos 8 caracteres.");

        bool hasLetter = newPassword.Any(char.IsLetter);
        bool hasNumber = newPassword.Any(char.IsDigit);
        bool hasSpecial = newPassword.Any(ch => !char.IsLetterOrDigit(ch));

        if (!hasLetter || !hasNumber || !hasSpecial)
            throw new Exception("La contraseña debe contener letras, números y al menos un carácter especial.");

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (result.Succeeded)
        {
            user.RequirePasswordChange = false;
            await _userManager.UpdateAsync(user);
            return true;
        }

        throw new Exception(string.Join(" ", result.Errors.Select(e => e.Description)));
    }

    public async Task<bool> VerifyRecoveryAsync(string email, string nationalId)
    {
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
            
        if (user == null) return false;
        return user.NationalId != null && user.NationalId.Trim() == nationalId.Trim();
    }

    public async Task<bool> ResetPasswordWithRecoveryAsync(string email, string nationalId, string newPassword)
    {
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
            
        if (user == null || user.NationalId?.Trim() != nationalId.Trim()) return false;

        // Validation: Min 8 chars, letter, number, special char
        if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 8)
            throw new Exception("La contraseña debe tener al menos 8 caracteres.");

        bool hasLetter = newPassword.Any(char.IsLetter);
        bool hasNumber = newPassword.Any(char.IsDigit);
        bool hasSpecial = newPassword.Any(ch => !char.IsLetterOrDigit(ch));

        if (!hasLetter || !hasNumber || !hasSpecial)
            throw new Exception("La contraseña debe contener letras, números y al menos un carácter especial.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        
        if (result.Succeeded)
        {
            user.RequirePasswordChange = false;
            await _userManager.UpdateAsync(user);
            return true;
        }

        throw new Exception(string.Join(" ", result.Errors.Select(e => e.Description)));
    }

    private async Task<LoginResponse> GenerateLoginResponse(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "User";

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, role),
            new Claim("CompanyId", user.CompanyId.ToString()),
            new Claim("CompanyName", user.Company?.Name ?? "Legalix")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(7);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new LoginResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            user.FullName,
            role,
            user.Email ?? "",
            user.Department?.Name ?? "N/A",
            user.CompanyId,
            user.Company?.Name ?? "Legalix",
            user.Id,
            user.Company?.CurrencyCode ?? "COP",
            user.Company?.TimeZone ?? "SA Pacific Standard Time",
            user.Company?.Language ?? "es-CO",
            user.MonthlyBudget,
            false, // Requires2FA handled in LoginAsync
            user.RequirePasswordChange,
            user.TwoFactorEnabled,
            user.ReportsToId,
            user.ReportsTo?.FullName
        );
    }
}
