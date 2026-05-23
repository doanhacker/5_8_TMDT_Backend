$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir ".venv\Scripts\python.exe"
$logPath = Join-Path $scriptDir "ai_service.log"
$errPath = Join-Path $scriptDir "ai_service.err.log"
$pidPath = Join-Path $scriptDir "ai_service.pid"
$healthUrl = "http://127.0.0.1:8001/health"

function Get-AiServicePid {
    $match = netstat -ano | Select-String "127.0.0.1:8001"
    foreach ($line in $match) {
        $text = $line.ToString().Trim()
        if ($text -match "\s+LISTENING\s+(\d+)$") {
            return $matches[1]
        }
    }
    return $null
}

if (-not (Test-Path $venvPython)) {
    Write-Host "Khong tim thay .venv, dang tao moi..."
    python -m venv .venv
}

if (-not (Test-Path $venvPython)) {
    throw "Khong the tao moi truong ao .venv."
}

try {
    $health = Invoke-WebRequest -UseBasicParsing $healthUrl -TimeoutSec 2
    if ($health.StatusCode -eq 200) {
        $runningPid = Get-AiServicePid
        if ($runningPid) {
            Set-Content -Path $pidPath -Value $runningPid
        }
        Write-Host "AI service da dang chay tai $healthUrl"
        exit 0
    }
} catch {
}

if (Test-Path $pidPath) {
    $existingPid = Get-Content $pidPath -ErrorAction SilentlyContinue
    if ($existingPid) {
        $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($existingProcess) {
            Write-Host "AI service da dang chay voi PID $existingPid"
            exit 0
        }
    }
    Remove-Item -LiteralPath $pidPath -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $logPath, $errPath -ErrorAction SilentlyContinue

$process = Start-Process `
    -FilePath $venvPython `
    -ArgumentList @("-u", "app.py", "--host", "127.0.0.1", "--port", "8001") `
    -WorkingDirectory $scriptDir `
    -RedirectStandardOutput $logPath `
    -RedirectStandardError $errPath `
    -PassThru

Start-Sleep -Seconds 2

$runningProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
if (-not $runningProcess) {
    Write-Host "AI service khoi dong that bai."
    if (Test-Path $errPath) {
        Get-Content $errPath -Tail 20
    }
    exit 1
}

Set-Content -Path $pidPath -Value $process.Id
Write-Host "AI service dang chay tai http://127.0.0.1:8001"
Write-Host "PID: $($process.Id)"
Write-Host "Log: $logPath"
