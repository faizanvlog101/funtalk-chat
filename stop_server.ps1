# stop_server.ps1 - Stop any running FUN Talk server on port 3000
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "             Stopping FUN Talk Server              " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$pids = @()
try {
    $conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique
    }
} catch {}

if ($pids.Count -gt 0) {
    foreach ($p in $pids) {
        if ($p -gt 0) {
            try {
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                Write-Host "[OK] Stopped FUN Talk server process (PID: $p)" -ForegroundColor Green
            } catch {
                Write-Host "[WARN] Could not stop PID $p : $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "[INFO] No FUN Talk server was found running on port 3000." -ForegroundColor Cyan
}

Write-Host "`nProcess complete." -ForegroundColor Gray
