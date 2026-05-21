Write-Host "Starting GlutiSafe Services..." -ForegroundColor Green

# Start Client
Write-Host "Starting React Client on port 5173..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:client"

# Start Server
Write-Host "Starting Node Server on port 5000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:server"

# Start OCR Service
Write-Host "Starting OCR Service on port 8000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ocr-service; if (Test-Path .venv\Scripts\activate.ps1) { .\.venv\Scripts\activate.ps1 }; uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "All services started in separate windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Node API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "OCR API: http://localhost:8000" -ForegroundColor Cyan
