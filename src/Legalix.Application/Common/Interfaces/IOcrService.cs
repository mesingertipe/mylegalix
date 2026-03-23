namespace Legalix.Application.Common.Interfaces;

public interface IOcrService
{
    Task<OcrResult> ExtractInvoiceDataAsync(Stream fileStream);
}

public record OcrResult(
    string? Nit,
    string? RazonSocial,
    DateTime? InvoiceDate,
    string? InvoiceNumber,
    decimal TotalAmount,
    decimal TaxAmount,
    string? Cufe,
    string? Category // e.g., Alimentación, Transporte, Alojamiento
);
