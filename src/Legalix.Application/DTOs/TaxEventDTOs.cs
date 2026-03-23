using System;

namespace Legalix.Application.DTOs;

public class TaxEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurringType { get; set; }
    public string Color { get; set; } = "#6366f1";
    public bool IsFullDay { get; set; }
    public bool IsCompleted { get; set; }
}

public class CreateTaxEventRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurringType { get; set; }
    public string Color { get; set; } = "#6366f1";
    public bool IsFullDay { get; set; } = true;
}

public class UpdateTaxEventRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public bool? IsRecurring { get; set; }
    public string? RecurringType { get; set; }
    public string? Color { get; set; }
    public bool? IsFullDay { get; set; }
    public bool? IsCompleted { get; set; }
}
