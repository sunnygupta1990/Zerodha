@echo off
echo ========================================
echo ZERODHA REQUEST TOKEN GENERATOR
echo ========================================
echo.
echo Step 1: This will open Zerodha login page
echo Step 2: Login with your Zerodha credentials
echo Step 3: Copy the request token from the URL
echo Step 4: Run the Python script with that token
echo.
pause
echo.
echo Opening Zerodha login page...
start "" "https://kite.trade/connect/login?api_key=lyeyc9g06ol4o3fi&redirect_params=https://zerodha-dung85nyp-sunnygupta1990s-projects.vercel.app/redirect.html"
echo.
echo After login, you'll be redirected to a page with request token in URL
echo Copy the request_token value and use it in the Python script
echo.
echo Now run: python test_tcs_order.py
echo.
pause
