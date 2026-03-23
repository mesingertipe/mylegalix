using Legalix.Application.Common.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;

namespace Legalix.Infrastructure.Services;

public class BalanceService
{
    private readonly ApplicationDbContext _context;

    public BalanceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task UpdateBalanceAsync(Guid cardId, decimal amount, TransactionType type, string description, Guid? referenceId = null)
    {
        var card = await _context.VirtualCards.FindAsync(cardId);
        if (card == null) throw new Exception("Card not found");

        var previousBalance = card.AvailableBalance;
        
        if (type == TransactionType.Expense)
        {
            if (card.AvailableBalance < amount)
                throw new Exception("Insufficient funds");
                
            card.AvailableBalance -= amount;
        }
        else if (type == TransactionType.Reload)
        {
            card.AvailableBalance += amount;
        }

        var audit = new TransactionAudit
        {
            VirtualCardId = cardId,
            Amount = amount,
            PreviousBalance = previousBalance,
            NewBalance = card.AvailableBalance,
            Type = type,
            Description = description,
            ReferenceId = referenceId,
            CompanyId = card.CompanyId
        };

        _context.TransactionAudits.Add(audit);
        await _context.SaveChangesAsync();
    }
}
