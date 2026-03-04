@echo off
echo ========================================
echo    MOHZZZZ SCRIPT HUB - DEPLOY
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo FAILED: npm install error
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Netlify CLI...
call npm install -g netlify-cli
if errorlevel 1 (
    echo FAILED: netlify-cli install error
    pause
    exit /b 1
)

echo.
echo [3/4] Logging into Netlify...
call netlify login
echo.

echo [4/4] Deploying with build...
call netlify deploy --build --prod
echo.

echo ========================================
echo    DEPLOY COMPLETE!
echo ========================================
echo.
echo If this is your first deploy, run:
echo   netlify link
echo Then re-run this script.
echo.
pause
