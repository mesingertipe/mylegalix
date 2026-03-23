using Legalix.Application.Common.Interfaces;

namespace Legalix.Infrastructure.Services;

public class MockStorageService : IStorageService
{
    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        await Task.Delay(500);
        return $"https://firebasestorage.googleapis.com/v0/b/legalix/o/mock_{Guid.NewGuid()}_{fileName}";
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        await Task.Delay(100);
    }
}
