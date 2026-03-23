using Legalix.Application.Common.Interfaces;
using Legalix.Application.Interfaces;
using Legalix.Domain.Entities;
using Legalix.Infrastructure.Persistence;
using Legalix.Infrastructure.Services;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Legalix API", Version = "v1" });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder => 
        builder.WithOrigins("http://localhost:5173", "https://mylegalix.com") // Add production URL too
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials());
});

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("Legalix.Infrastructure")));

// Identity
builder.Services.AddIdentity<User, Role>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Auth
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));
    options.AddPolicy("TenantAdminOrAbove", policy => policy.RequireRole("SuperAdmin", "TenantAdmin"));
    options.AddPolicy("AccountantOrAbove", policy => policy.RequireRole("SuperAdmin", "TenantAdmin", "Accountant"));
    options.AddPolicy("AreaLeaderOrAbove", policy => policy.RequireRole("SuperAdmin", "TenantAdmin", "AreaLeader"));
});

// Custom Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<BalanceService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IOcrService, MockOcrService>();
builder.Services.AddScoped<IStorageService, MockStorageService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITaxEventService, TaxEventService>();

var app = builder.Build();

// Enable Swagger in all environments for now (Debugging)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("v1/swagger.json", "Legalix API V1");
    // To serve the Swagger UI at the app's root (http://localhost:<port>/),
    // set the RoutePrefix property to an empty string.
    c.RoutePrefix = "swagger";
});

app.UseRouting();
app.UseCors("AllowAll");

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // 1. Ensure Migrations are applied
        await context.Database.MigrateAsync();

        var userManager = services.GetRequiredService<UserManager<User>>();
        var roleManager = services.GetRequiredService<RoleManager<Role>>();
        
        // Seeding as a separate background-like task to not block App.Run
        _ = DbInitializer.SeedAsync(context, userManager, roleManager)
            .ContinueWith(t => {
                if (t.IsFaulted) Console.WriteLine("Initial seed failed, but app is running.");
            });
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al sembrar la base de datos.");
    }
}

app.Run();
