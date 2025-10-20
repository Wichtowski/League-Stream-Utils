@echo off
echo 🎮 League Data Collector - Build Script
echo ========================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Check if league_collector.py exists
if not exist "league_collector.py" (
    echo ❌ league_collector.py not found
    pause
    exit /b 1
)

REM Run the build script
echo 🔨 Starting build process...
python build_executable.py

if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo 📁 Executable location: dist\LeagueDataCollector.exe
echo.
echo 📋 Usage instructions:
echo 1. Run: LeagueDataCollector.exe
echo 2. Enter Match ID when prompted
echo 3. Enter MongoDB URI when prompted
echo 4. The collector will start polling every 1 second
echo 5. Press Ctrl+C to stop
echo.
pause

