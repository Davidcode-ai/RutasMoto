# MotoRutas — arranque local (Windows)
$root = Split-Path -Parent $PSScriptRoot

foreach ($port in 4321, 4322) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Write-Host "Iniciando API en http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "Iniciando frontend en http://127.0.0.1:4321 ..."
Set-Location "$root\frontend"
npm run dev -- --host 127.0.0.1 --port 4321
