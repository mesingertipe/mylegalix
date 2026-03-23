using Legalix.Application.Common.Interfaces;

namespace Legalix.Infrastructure.Services;

public class MockOcrService : IOcrService
{
    public async Task<OcrResult> ExtractInvoiceDataAsync(Stream fileStream)
    {
        await Task.Delay(1000); // Simulate processing
        return new OcrResult(
            "900.123.456-1",
            "Restaurante El Gourmet",
            DateTime.UtcNow,
            "FE-450",
            85000m,
            13571m,
            "CUFE-TEST-12345",
            "Alimentación"
        );
    }
}
