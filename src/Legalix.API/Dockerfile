FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /app

# Copy all projects
COPY ["Legalix.Domain/Legalix.Domain.csproj", "Legalix.Domain/"]
COPY ["Legalix.Application/Legalix.Application.csproj", "Legalix.Application/"]
COPY ["Legalix.Infrastructure/Legalix.Infrastructure.csproj", "Legalix.Infrastructure/"]
COPY ["Legalix.API/Legalix.API.csproj", "Legalix.API/"]

RUN dotnet restore "Legalix.API/Legalix.API.csproj"

COPY . .
WORKDIR "/app/Legalix.API"
RUN dotnet build "Legalix.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Legalix.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Legalix.API.dll"]
