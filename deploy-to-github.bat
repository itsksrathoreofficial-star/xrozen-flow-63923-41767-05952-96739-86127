@echo off
echo Deploying Xrozen Flow App to GitHub...
echo.

REM Set up git configuration
git config --global user.name "itsksrathoreofficial-star"
git config --global user.email "itsksrathoreofficial-star@users.noreply.github.com"

REM Add all files
git add .

REM Commit changes
git commit -m "Deploy Xrozen Flow App - Complete React TypeScript Application"

REM Set remote URL
git remote set-url origin https://github.com/itsksrathoreofficial-star/xrozen-flow-63923-41767-05952-96739-86127.git

REM Push to GitHub
echo Attempting to push to GitHub...
git push -u origin main

echo.
echo Deployment completed!
echo Your app is now available at: https://github.com/itsksrathoreofficial-star/xrozen-flow-63923-41767-05952-96739-86127
pause
