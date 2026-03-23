using Legalix.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Legalix.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        // 1. Ensure Roles exist
        var roles = new[] { "SuperAdmin", "TenantAdmin", "AreaLeader", "Accountant", "User" };
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role { Id = Guid.NewGuid(), Name = roleName });
            }
        }

        // 2. Ensure we have the system Company (Legalix HQ)
        var hqCompany = await context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Name == "Legalix HQ");
        if (hqCompany == null)
        {
            hqCompany = new Company
            {
                Id = Guid.NewGuid(),
                Name = "Legalix HQ",
                Nit = "900.123.456-1",
                Address = "Calle 100 #15-37, Bogotá",
                IsDeleted = false
            };
            context.Companies.Add(hqCompany);
            await context.SaveChangesAsync();
        }

        // 3. Ensure we have a Demo Tenant Company
        var demoCompany = await context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Name == "Legalix Demo Corp");
        if (demoCompany == null)
        {
            demoCompany = new Company
            {
                Id = Guid.NewGuid(),
                Name = "Legalix Demo Corp",
                Nit = "800.987.654-3",
                Address = "Carrera 7 #71-21, Bogotá",
                IsDeleted = false
            };
            context.Companies.Add(demoCompany);
            await context.SaveChangesAsync();
        }

        // 4. Seed Super Admin (Global)
        await CreateUserIfNotExist(context, userManager, "admin@legalix.com", "Tito Alejandro", "SuperAdmin", hqCompany.Id);
        
        // Secondary Super Admin for recovery/dev
        await CreateUserIfNotExist(context, userManager, "dev@legalix.com", "Dev Recovery", "SuperAdmin", hqCompany.Id);

        // 5. Seed Tenant Admin (Demo Corp)
        await CreateUserIfNotExist(context, userManager, "admin@democorp.com", "Admin Demo Corp", "TenantAdmin", demoCompany.Id);

        // 6. Seed Accountant (Demo Corp)
        await CreateUserIfNotExist(context, userManager, "contable@democorp.com", "Carlos Contador", "Accountant", demoCompany.Id);

        // 7. Seed Area Leader & Department (Demo Corp)
        var leader = await CreateUserIfNotExist(context, userManager, "leader@democorp.com", "Laura Líder", "AreaLeader", demoCompany.Id);
        
        var department = await context.Departments.IgnoreQueryFilters().FirstOrDefaultAsync(d => d.Name == "Ventas" && d.CompanyId == demoCompany.Id);
        if (department == null && leader != null)
        {
            department = new Department
            {
                Id = Guid.NewGuid(),
                Name = "Ventas",
                CompanyId = demoCompany.Id,
                ManagerId = leader.Id,
                MonthlyBudget = 5000000
            };
            context.Departments.Add(department);
            await context.SaveChangesAsync();
        }

        // 8. Seed Regular User (Demo Corp)
        var regularUser = await CreateUserIfNotExist(context, userManager, "user@democorp.com", "Uriel Usuario", "User", demoCompany.Id);
        if (regularUser != null && department != null)
        {
            regularUser.DepartmentId = department.Id;
            await userManager.UpdateAsync(regularUser);
        }
    }

    private static async Task<User?> CreateUserIfNotExist(ApplicationDbContext context, UserManager<User> userManager, string email, string fullName, string role, Guid companyId)
    {
        try 
        {
            // Use the context directly to ensure we ignore ALL filters and find the user even if they are in another tenant
            var user = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
            
            if (user == null)
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = email,
                    Email = email,
                    FullName = fullName,
                    NationalId = "12345678", // Default for seed
                    EmailConfirmed = true,
                    CompanyId = companyId,
                    IsDeleted = false
                };

                var result = await userManager.CreateAsync(user, "Legalix2024*");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                    return user;
                }
            }
            else
            {
                // Force reset of vital info in development/seed environments
                user.NationalId = "12345678";
                user.PasswordHash = userManager.PasswordHasher.HashPassword(user, "Legalix2024*");
                await userManager.UpdateAsync(user);

                // Ensure Role is correct
                if (!await userManager.IsInRoleAsync(user, role))
                {
                    var currentRoles = await userManager.GetRolesAsync(user);
                    await userManager.RemoveFromRolesAsync(user, currentRoles);
                    await userManager.AddToRoleAsync(user, role);
                }
                return user;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SEED ERROR] Failed to seed/update {email}: {ex.Message}");
        }
        return null;
    }
}
