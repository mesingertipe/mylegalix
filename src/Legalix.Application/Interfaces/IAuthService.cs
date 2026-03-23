using Legalix.Application.DTOs;

namespace Legalix.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
    Task<bool> Toggle2FAAsync(Guid userId, bool enable);
    Task<string> Generate2FASecretAsync(Guid userId);
    Task<bool> Verify2FASecretAsync(Guid userId, string code);
    Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
    Task<bool> VerifyRecoveryAsync(string email, string nationalId);
    Task<bool> ResetPasswordWithRecoveryAsync(string email, string nationalId, string newPassword);
}
