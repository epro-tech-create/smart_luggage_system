$ErrorActionPreference = "Stop"

if (-not $env:DB_USERNAME) {
    $env:DB_USERNAME = "postgres"
}

if (-not $env:SERVER_PORT) {
    $env:SERVER_PORT = "8195"
}

if (-not $env:DB_PASSWORD) {
    $env:DB_PASSWORD = "zzql@1234"
}

if (-not $env:DB_URL) {
    $env:DB_URL = "jdbc:postgresql://localhost:5432/smart_luggage_system"
}

Write-Host "Starting Smart Luggage backend on port $($env:SERVER_PORT)"
Write-Host "Database: $($env:DB_URL)"

& "C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
