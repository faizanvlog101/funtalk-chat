@echo off
title Stop FUN Talk Server
cd /d "%~dp0"

echo ===================================================
echo             Stopping FUN Talk Server
echo ===================================================
echo.

powershell -NoProfile -Command ^
  "$pids = @(); " ^
  "try { " ^
  "  $conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { $pids += $conns.OwningProcess | Select-Object -Unique }; " ^
  "} catch {}; " ^
  "if ($pids.Count -gt 0) { " ^
  "  foreach ($pidToKill in $pids) { " ^
  "    if ($pidToKill -gt 0) { " ^
  "      try { " ^
  "        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue; " ^
  "        Write-Host ('[OK] Stopped FUN Talk server process (PID: ' + $pidToKill + ')') -ForegroundColor Green; " ^
  "      } catch { " ^
  "        Write-Host ('[WARN] Could not stop PID ' + $pidToKill + ': ' + $_.Exception.Message) -ForegroundColor Yellow; " ^
  "      } " ^
  "    } " ^
  "  } " ^
  "} else { " ^
  "  Write-Host '[INFO] No FUN Talk server was found running on port 3000.' -ForegroundColor Cyan; " ^
  "}"

echo.
echo Process complete.
ping -n 3 127.0.0.1 >nul
