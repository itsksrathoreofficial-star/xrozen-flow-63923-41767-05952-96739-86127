Write-Host "Deploying Xrozen Flow App to GitHub..." -ForegroundColor Green
Write-Host ""

# Set up git configuration
git config --global user.name "itsksrathoreofficial-star"
git config --global user.email "itsksrathoreofficial-star@users.noreply.github.com"

# Add all files
Write-Host "Adding files to git..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Deploy Xrozen Flow App - Complete React TypeScript Application"

# Set remote URL
Write-Host "Setting up remote repository..." -ForegroundColor Yellow
git remote set-url origin https://github.com/itsksrathoreofficial-star/xrozen-flow-63923-41767-05952-96739-86127.git

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your app is now available at: https://github.com/itsksrathoreofficial-star/xrozen-flow-63923-41767-05952-96739-86127" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
