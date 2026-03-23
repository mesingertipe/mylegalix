using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Legalix.Application.Common.Interfaces;
using Legalix.Application.DTOs;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Legalix.Infrastructure.Services;

public class TaxEventService : ITaxEventService
{
    private readonly ApplicationDbContext _context;

    public TaxEventService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TaxEventDto>> GetEventsAsync(DateTime start, DateTime end)
    {
        // Ensure UTC for PostgreSQL
        var utcStart = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        var utcEnd = DateTime.SpecifyKind(end, DateTimeKind.Utc);

        var events = await _context.TaxEvents
            .Where(e => e.DueDate >= utcStart && e.DueDate <= utcEnd)
            .OrderBy(e => e.DueDate)
            .ToListAsync();

        return events.Select(MapToDto);
    }

    public async Task<TaxEventDto> GetByIdAsync(Guid id)
    {
        var e = await _context.TaxEvents.FindAsync(id);
        if (e == null) return null;
        return MapToDto(e);
    }

    public async Task<TaxEventDto> CreateAsync(CreateTaxEventRequest request)
    {
        var e = new TaxEvent
        {
            Title = request.Title,
            Description = request.Description,
            DueDate = DateTime.SpecifyKind(request.DueDate, DateTimeKind.Utc),
            IsRecurring = request.IsRecurring,
            RecurringType = request.RecurringType,
            Color = request.Color,
            IsFullDay = request.IsFullDay
        };

        _context.TaxEvents.Add(e);
        await _context.SaveChangesAsync();

        return MapToDto(e);
    }

    public async Task<TaxEventDto> UpdateAsync(Guid id, UpdateTaxEventRequest request)
    {
        var e = await _context.TaxEvents.FindAsync(id);
        if (e == null) return null;

        if (request.Title != null) e.Title = request.Title;
        if (request.Description != null) e.Description = request.Description;
        if (request.DueDate.HasValue) e.DueDate = DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc);
        if (request.IsRecurring.HasValue) e.IsRecurring = request.IsRecurring.Value;
        if (request.RecurringType != null) e.RecurringType = request.RecurringType;
        if (request.Color != null) e.Color = request.Color;
        if (request.IsFullDay.HasValue) e.IsFullDay = request.IsFullDay.Value;
        if (request.IsCompleted.HasValue) e.IsCompleted = request.IsCompleted.Value;

        await _context.SaveChangesAsync();

        return MapToDto(e);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var e = await _context.TaxEvents.FindAsync(id);
        if (e == null) return false;

        _context.TaxEvents.Remove(e);
        await _context.SaveChangesAsync();
        return true;
    }

    private TaxEventDto MapToDto(TaxEvent e)
    {
        return new TaxEventDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            DueDate = e.DueDate,
            IsRecurring = e.IsRecurring,
            RecurringType = e.RecurringType,
            Color = e.Color,
            IsFullDay = e.IsFullDay,
            IsCompleted = e.IsCompleted
        };
    }
}
