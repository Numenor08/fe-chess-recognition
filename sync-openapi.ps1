$ErrorActionPreference = "Stop"

$OpenApiUrl = "http://127.0.0.1:8000/openapi.json"
$OutputPath = Join-Path $PSScriptRoot "docs/api/openapi.json"

New-Item -ItemType Directory -Force `
    -Path (Split-Path $OutputPath) | Out-Null

try {
    Invoke-WebRequest `
        -Uri $OpenApiUrl `
        -OutFile $OutputPath

    Write-Host "OpenAPI berhasil disinkronkan: $OutputPath" `
        -ForegroundColor Green
}
catch {
    Write-Host "Gagal mengambil OpenAPI dari backend." `
        -ForegroundColor Red

    Write-Host "Pastikan FastAPI berjalan di $OpenApiUrl"
    throw
}