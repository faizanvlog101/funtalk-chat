# start_server.ps1 - PowerShell script to start FUN Talk with dependency checks
$Host.UI.RawUI.WindowTitle = "FUN Talk Chat Server"
$appDir = $PSScriptRoot
Set-Location $appDir

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "            FUN Talk - Web IRC Server              " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/"
    Read-Host "Press Enter to exit..."
    exit 1
}

# 2. Check dependencies
if (-not (Test-Path "$appDir\node_modules") -or -not (Test-Path "$appDir\node_modules\express")) {
    Write-Host "[FIRST RUN] Required libraries not found. Installing now..." -ForegroundColor Yellow
    Write-Host "Running: npm install" -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed. Check internet connection." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit 1
    }
    Write-Host "[OK] Dependencies installed successfully!`n" -ForegroundColor Green
}

# 3. Launch Server
Write-Host "---------------------------------------------------" -ForegroundColor DarkGray
Write-Host " Starting FUN Talk Server on http://localhost:3000 " -ForegroundColor Green
Write-Host " Press Ctrl+C or run .\stop_server.ps1 to stop.    " -ForegroundColor Gray
Write-Host "---------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

node server.js
