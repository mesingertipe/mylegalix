using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Legalix.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReportsToToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReportsToId",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_ReportsToId",
                table: "AspNetUsers",
                column: "ReportsToId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_AspNetUsers_ReportsToId",
                table: "AspNetUsers",
                column: "ReportsToId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_AspNetUsers_ReportsToId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_ReportsToId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ReportsToId",
                table: "AspNetUsers");
        }
    }
}
