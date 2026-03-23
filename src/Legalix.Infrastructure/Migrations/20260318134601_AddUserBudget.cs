using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Legalix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserBudget : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyBudget",
                table: "AspNetUsers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MonthlyBudget",
                table: "AspNetUsers");
        }
    }
}
