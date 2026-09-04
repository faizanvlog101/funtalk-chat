@echo off
title FUN Talk Chat Server
cd /d "%~dp0"

echo ===================================================
echo             FUN Talk - Web IRC Server
echo ===================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check if dependencies are installed (First Run Check)
if not exist "node_modules\" (
    echo [FIRST RUN] Dependencies not found!
    echo Installing necessary libraries...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed. Please check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] All necessary libraries have been installed successfully!
    echo.
)

:: 3. Launch Server
echo ---------------------------------------------------
echo  Starting FUN Talk Server on http://localhost:3000
echo  Press Ctrl+C or run stop_server.bat to stop.
echo ---------------------------------------------------
echo.

node server.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo Server exited with code %ERRORLEVEL%.
    pause
)
