namespace Legalix.Application.DTOs;

public record LoginRequest(string Email, string Password, string? TwoFactorCode = null);

public record LoginResponse(
    string Token, 
    DateTime Expiration, 
    string FullName, 
    string Role,
    string Email,
    string DepartmentName,
    Guid CompanyId, 
    string CompanyName, 
    Guid Id,
    string CurrencyCode = "COP",
    string TimeZone = "SA Pacific Standard Time",
    string Language = "es-CO",
    decimal MonthlyBudget = 0,
    bool Requires2FA = false,
    bool RequirePasswordChange = false,
    bool Is2FAEnabled = false,
    Guid? ReportsToId = null,
    string? ReportsToFullName = null);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);

public record ApiKeyDto(Guid Id, string Name, string? Description, string? Key, DateTime? LastUsedAt, bool IsActive);

public record CreateApiKeyRequest(string Name, string? Description);

public record RecoveryVerifyRequest(string Email, string NationalId);

public record RecoveryResetRequest(string Email, string NationalId, string NewPassword);
