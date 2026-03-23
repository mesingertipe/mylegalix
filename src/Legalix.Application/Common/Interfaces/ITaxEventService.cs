using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Legalix.Application.DTOs;

namespace Legalix.Application.Common.Interfaces;

public interface ITaxEventService
{
    Task<IEnumerable<TaxEventDto>> GetEventsAsync(DateTime start, DateTime end);
    Task<TaxEventDto> GetByIdAsync(Guid id);
    Task<TaxEventDto> CreateAsync(CreateTaxEventRequest request);
    Task<TaxEventDto> UpdateAsync(Guid id, UpdateTaxEventRequest request);
    Task<bool> DeleteAsync(Guid id);
}
