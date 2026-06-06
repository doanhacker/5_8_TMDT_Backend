# Giải phóng port 5000 (backend TMDT) khi bị EADDRINUSE
$lines = netstat -ano | Select-String ':5000\s+.*LISTENING'
foreach ($line in $lines) {
    if ($line -match '\s+(\d+)\s*$') {
        $procId = [int]$matches[1]
        if ($procId -gt 0) {
            Write-Host "Dung process PID $procId (port 5000)..."
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 1
$check = netstat -ano | Select-String ':5000\s+.*LISTENING'
if ($check) { Write-Host "Van con process tren port 5000." -ForegroundColor Yellow }
else { Write-Host "Port 5000 da trong. Chay: cd backend; npm run dev" -ForegroundColor Green }
