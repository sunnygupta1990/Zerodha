@echo off
echo ========================================
echo   Zerodha Trading Algorithm System
echo ========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo Python found!
echo.

echo Installing/Updating Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

echo Starting Algorithm Executor API Server...
echo.
echo The API server will run on http://localhost:5000
echo.
echo Available endpoints:
echo   POST /api/deploy - Deploy algorithm
echo   POST /api/stop/^<id^> - Stop algorithm
echo   GET  /api/deployments - List deployments
echo   POST /api/test-connection - Test API connection
echo   GET  /api/health - Health check
echo.
echo Press Ctrl+C to stop the server
echo.

python api_server.py
