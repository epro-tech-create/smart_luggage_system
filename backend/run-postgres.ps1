$ErrorActionPreference = "Stop"

if (-not $env:DB_USERNAME) {
    $env:DB_USERNAME = "postgres"
}

if (-not $env:DB_PASSWORD) {
    $securePassword = Read-Host "PostgreSQL password for $($env:DB_USERNAME)" -AsSecureString
    $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

if (-not $env:DB_URL) {
    $env:DB_URL = "jdbc:postgresql://localhost:5432/smart_luggage_system"
}

& "C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
