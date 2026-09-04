@echo off
title FUN Talk - Share Public URL
cd /d "%~dp0"

echo ===================================================
echo             FUN Talk - Share Online
echo ===================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

:: Check if server is running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] FUN Talk server is not running yet.
    echo Starting the server in background first...
    start /min "FUN Talk Server" cmd /c "node server.js"
    timeout /t 2 /nobreak >nul
)

echo [OK] Server running on http://localhost:3000
echo.
echo ---------------------------------------------------
echo Generating free secure public URL (no signup needed)...
echo Copy and share the URL shown below with anyone!
echo (Keep this window open while sharing)
echo ---------------------------------------------------
echo.

npx --yes localtunnel --port 3000
echo.
pause
