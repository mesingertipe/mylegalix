using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Legalix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxEventColorAndFullDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "TaxEvents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsFullDay",
                table: "TaxEvents",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "TaxEvents");

            migrationBuilder.DropColumn(
                name: "IsFullDay",
                table: "TaxEvents");
        }
    }
}
