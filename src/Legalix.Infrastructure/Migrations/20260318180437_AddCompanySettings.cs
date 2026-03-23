using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Legalix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DailyExpenseLimit",
                table: "Companies",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "MultiLanguageOcr",
                table: "Companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Require2FA",
                table: "Companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RetroactiveExpensesDays",
                table: "Companies",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "StrictFiscalValidation",
                table: "Companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DailyExpenseLimit",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "MultiLanguageOcr",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Require2FA",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "RetroactiveExpensesDays",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "StrictFiscalValidation",
                table: "Companies");
        }
    }
}
