using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Legalix.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IOcrService _ocrService;
    private readonly IStorageService _storageService;
    private readonly BalanceService _balanceService;
    private readonly INotificationService _notificationService;
    private readonly UserManager<User> _userManager;

    public ExpensesController(
        ApplicationDbContext context, 
        IOcrService ocrService, 
        IStorageService storageService,
        BalanceService balanceService,
        INotificationService notificationService,
        UserManager<User> userManager)
    {
        _context = context;
        _ocrService = ocrService;
        _storageService = storageService;
        _balanceService = balanceService;
        _notificationService = notificationService;
        _userManager = userManager;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadExpense(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        // 1. Upload to Firebase
        using var stream = file.OpenReadStream();
        var storageUrl = await _storageService.UploadFileAsync(stream, file.FileName, file.ContentType);

        // 2. OCR Processing
        stream.Position = 0;
        var ocrResult = await _ocrService.ExtractInvoiceDataAsync(stream);

        // 3. Create Expense Record
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        var currentUserId = Guid.Parse(currentUserIdStr);

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user == null) return Unauthorized();
        var userId = user.Id;

        user = await _context.Users
            .Include(u => u.Department)
            .Include(u => u.VirtualCard)
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user == null) return Unauthorized();

        // 3.0 Fiscal Period Check
        var invoiceDate = ocrResult.InvoiceDate ?? DateTime.UtcNow;
        var invoiceMonth = invoiceDate.Month;
        var invoiceYear = invoiceDate.Year;
        
        var period = await _context.FiscalPeriods
            .FirstOrDefaultAsync(p => p.Month == invoiceMonth && p.Year == invoiceYear);

        if (period == null)
            return BadRequest(new { Message = $"No existe un periodo fiscal definido para {invoiceMonth:D2}/{invoiceYear}. Por favor, contacte a contabilidad." });

        if (period.Status == PeriodStatus.Closed)
            return BadRequest(new { Message = $"El periodo fiscal {period.Name} ya se encuentra CERRADO. No es posible legalizar más gastos para este mes." });

        // 3.1 Budget Check (Monthly)
        var monthlySpent = await _context.Expenses
            .Where(e => e.UserId == userId && e.InvoiceDate.HasValue && e.InvoiceDate.Value.Month == invoiceMonth && e.InvoiceDate.Value.Year == invoiceYear && e.Status != ExpenseStatus.Rejected)
            .SumAsync(e => e.TotalAmount);

        var isBudgetExceeded = (monthlySpent + ocrResult.TotalAmount) > user.MonthlyBudget;

        // 3.2 Daily Limit Check (By Invoice Date)
        var dailySpent = await _context.Expenses
            .Where(e => e.UserId == userId && e.InvoiceDate.HasValue && e.InvoiceDate.Value.Date == invoiceDate.Date && e.Status != ExpenseStatus.Rejected)
            .SumAsync(e => e.TotalAmount);

        var dailyLimit = user.Company?.DailyExpenseLimit ?? 800000;
        var isDailyLimitExceeded = (dailySpent + ocrResult.TotalAmount) > dailyLimit;

        string? adminComment = null;
        var alerts = new List<string>();
        if (isBudgetExceeded) alerts.Add("presupuesto MENSUAL");
        if (isDailyLimitExceeded) alerts.Add("LÍMITE DIARIO");

        if (alerts.Any())
        {
            adminComment = "ALERTA: Este gasto excede el " + string.Join(" y el ", alerts) + " permitido.";
        }
        
        var expense = new Expense
        {
            UserId = userId,
            CompanyId = user.CompanyId,
            Nit = ocrResult.Nit,
            RazonSocial = ocrResult.RazonSocial,
            InvoiceDate = ocrResult.InvoiceDate,
            InvoiceNumber = ocrResult.InvoiceNumber,
            TotalAmount = ocrResult.TotalAmount,
            TaxAmount = ocrResult.TaxAmount,
            Cufe = ocrResult.Cufe,
            Status = ExpenseStatus.Pending,
            IsDeductible = !string.IsNullOrEmpty(ocrResult.Cufe),
            Category = ocrResult.Category ?? "Varios",
            AdminComment = adminComment
        };

        // Add Attachment
        expense.Attachments.Add(new Attachment
        {
            FileName = file.FileName,
            StorageUrl = storageUrl,
            ContentType = file.ContentType,
            FileSize = file.Length
        });

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        // 4. Notify Manager (Centralized Discovery: Direct Boss -> Dept Manager -> Admin)
        var approverId = await _notificationService.GetExpenseApproverIdAsync(userId);
        if (approverId != null)
        {
            await _notificationService.NotifyLeaderOfNewExpenseAsync(
                approverId.Value, 
                user.FullName, 
                expense.TotalAmount
            );
        }

        // 5. Update Balance (Real-time deduction from Virtual Card if any)
        if (user.VirtualCard != null)
        {
            try 
            {
                await _balanceService.UpdateBalanceAsync(
                    user.VirtualCard.Id, 
                    expense.TotalAmount, 
                    TransactionType.Expense, 
                    $"Expense at {expense.RazonSocial ?? "Unknown"}",
                    expense.Id);
            }
            catch (Exception ex)
            {
                // We keep the expense but log the balance error
                Console.WriteLine($"WARNING: Failed to update balance for VirtualCard {user.VirtualCard.Id}: {ex.Message}");
            }
        }

        return Ok(expense);
    }

    [HttpGet]
    public async Task<IActionResult> GetExpenses([FromQuery] bool onlyMine = false)
    {
        var currentUserIdStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        var currentUserId = Guid.Parse(currentUserIdStr);

        // We use IgnoreQueryFilters to ensure SuperAdmin can be found even if they switch to a tenant where they are not a member
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user == null) return Unauthorized();

        var isSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");
        var isTenantAdmin = await _userManager.IsInRoleAsync(user, "TenantAdmin");

        var query = _context.Expenses
            .Include(e => e.User)
            .Include(e => e.Attachments)
            .AsQueryable();

        if (isSuperAdmin && _context.TenantId == Guid.Empty)
        {
            query = query.IgnoreQueryFilters();
        }

        if (onlyMine)
        {
            // Mode 1: Personal Expenses Only
            query = query.Where(e => e.UserId == currentUserId);
        }
        else 
        {
            // Mode 2 & 3: Team/Admin View - ALWAYS EXCLUDE Personal Expenses
            // We use a safe comparison to ensure self-filtering
            query = query.Where(e => e.UserId != currentUserId);

            if (!isSuperAdmin && !isTenantAdmin)
            {
                // Mode 3: Manager View (Direct reports + Dept subordinates)
                var managedDeptIds = await _context.Departments
                    .Where(d => d.ManagerId == currentUserId)
                    .Select(d => d.Id)
                    .ToListAsync();

                query = query.Where(e => 
                    e.User!.ReportsToId == currentUserId || 
                    (e.User.ReportsToId == null && e.User.DepartmentId != null && managedDeptIds.Contains(e.User.DepartmentId.Value)));
            }
        }

        var result = await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new {
                e.Id,
                e.TotalAmount,
                e.TaxAmount,
                e.InvoiceNumber,
                e.InvoiceDate,
                e.RazonSocial,
                e.Nit,
                e.Category,
                e.Status,
                e.AdminComment,
                e.CreatedAt,
                e.UserId,
                User = e.User != null ? new {
                    e.User.Id,
                    e.User.FullName,
                    e.User.Email
                } : null,
                Attachments = e.Attachments.Select(a => new {
                    a.Id,
                    a.FileName,
                    a.StorageUrl
                })
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var expense = await _context.Expenses
            .Include(e => e.User)
                .ThenInclude(u => u.Department)
            .FirstOrDefaultAsync(e => e.Id == id);
            
        if (expense == null) return NotFound();

        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        var currentUserId = Guid.Parse(currentUserIdStr);

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user == null) return Unauthorized();

        var submitter = expense.User!;

        // Security Check: Use centralized approver discovery to see if current user is the valid approver
        var validApproverId = await _notificationService.GetExpenseApproverIdAsync(submitter.Id);
        bool isBoss = currentUserId == validApproverId;
        
        var isSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");
        var isTenantAdmin = await _userManager.IsInRoleAsync(user, "TenantAdmin");
                     
        if (!isBoss && !isTenantAdmin && !isSuperAdmin)
            return Forbid();

        // Security: Cannot approve own expenses
        if (expense.UserId == currentUserId)
            return BadRequest("No puedes aprobar tus propios gastos. Deben ser aprobados por otro administrador o superior.");

        expense.Status = ExpenseStatus.Approved;
        await _context.SaveChangesAsync();

        await _notificationService.NotifyEmployeeOfExpenseStatusAsync(expense.UserId, expense.RazonSocial ?? "Gasto", "Aprobado");

        return Ok(expense);
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id, [FromBody] string comment)
    {
        var expense = await _context.Expenses
            .Include(e => e.User)
                .ThenInclude(u => u.Department)
            .FirstOrDefaultAsync(e => e.Id == id);
            
        if (expense == null) return NotFound();

        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        var currentUserId = Guid.Parse(currentUserIdStr);

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user == null) return Unauthorized();

        var submitter = expense.User!;

        var validApproverId = await _notificationService.GetExpenseApproverIdAsync(submitter.Id);
        bool isBoss = currentUserId == validApproverId;
        
        var isSuperAdmin = await _userManager.IsInRoleAsync(user, "SuperAdmin");
        var isTenantAdmin = await _userManager.IsInRoleAsync(user, "TenantAdmin");
                     
        if (!isBoss && !isTenantAdmin && !isSuperAdmin)
            return Forbid();

        // Security: Cannot reject own expenses
        if (expense.UserId == currentUserId)
            return BadRequest("No puedes rechazar tus propios gastos.");

        expense.Status = ExpenseStatus.Rejected;
        expense.AdminComment = comment;
        await _context.SaveChangesAsync();

        await _notificationService.NotifyEmployeeOfExpenseStatusAsync(expense.UserId, expense.RazonSocial ?? "Gasto", "Rechazado", comment);

        return Ok(expense);
    }

    [HttpPost("seed-samples")]
    public async Task<IActionResult> SeedSamples()
    {
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr)) return Unauthorized();
        var currentUserId = Guid.Parse(currentUserIdStr);

        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user == null) return NotFound("User not found");
        var targetUserId = user.Id;

        var samples = new List<Expense>
        {
            new Expense { 
                UserId = targetUserId, 
                CompanyId = user.CompanyId, 
                RazonSocial = "Restaurante El Gourmet", 
                TotalAmount = 85000, 
                Status = ExpenseStatus.Pending, 
                Category = "Alimentación",
                CreatedAt = DateTime.UtcNow.AddHours(-2) 
            },
            new Expense { 
                UserId = targetUserId, 
                CompanyId = user.CompanyId, 
                RazonSocial = "Combustibles Terpel", 
                TotalAmount = 120000, 
                Status = ExpenseStatus.Pending, 
                Category = "Transporte",
                CreatedAt = DateTime.UtcNow.AddDays(-1) 
            },
            new Expense { 
                UserId = targetUserId, 
                CompanyId = user.CompanyId, 
                RazonSocial = "Hotel Dann Carlton", 
                TotalAmount = 450000, 
                Status = ExpenseStatus.Pending, 
                Category = "Alojamiento",
                AdminComment = "ALERTA: Este gasto excede el presupuesto mensual del usuario.",
                CreatedAt = DateTime.UtcNow.AddDays(-2) 
            },
            new Expense { 
                UserId = targetUserId, 
                CompanyId = user.CompanyId, 
                RazonSocial = "Papelería Aladino", 
                TotalAmount = 25600, 
                Status = ExpenseStatus.Pending, 
                Category = "Otros",
                CreatedAt = DateTime.UtcNow.AddHours(-5) 
            }
        };

        // Clear previous pending to avoid duplicates for the test
        var existing = await _context.Expenses.Where(e => e.UserId == targetUserId && e.Status == ExpenseStatus.Pending).ToListAsync();
        _context.Expenses.RemoveRange(existing);

        _context.Expenses.AddRange(samples);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "4 gastos de ejemplo creados con éxito. Por favor refresca el dashboard." });
    }
}
