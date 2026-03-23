using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Legalix.Application.Common.Interfaces;
using Legalix.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Legalix.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TaxEventsController : ControllerBase
{
    private readonly ITaxEventService _taxEventService;

    public TaxEventsController(ITaxEventService taxEventService)
    {
        _taxEventService = taxEventService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaxEventDto>>> GetEvents([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        if (start == default) start = DateTime.UtcNow.AddMonths(-1);
        if (end == default) end = DateTime.UtcNow.AddMonths(2);

        var events = await _taxEventService.GetEventsAsync(start, end);
        return Ok(events);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaxEventDto>> GetById(Guid id)
    {
        var e = await _taxEventService.GetByIdAsync(id);
        if (e == null) return NotFound();
        return Ok(e);
    }

    [HttpPost]
    public async Task<ActionResult<TaxEventDto>> Create(CreateTaxEventRequest request)
    {
        var e = await _taxEventService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = e.Id }, e);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TaxEventDto>> Update(Guid id, UpdateTaxEventRequest request)
    {
        var e = await _taxEventService.UpdateAsync(id, request);
        if (e == null) return NotFound();
        return Ok(e);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _taxEventService.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
