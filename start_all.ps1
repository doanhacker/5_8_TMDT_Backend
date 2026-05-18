$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $rootDir "backend\ai_service"
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

$backendPidPath = Join-Path $rootDir "backend.dev.pid"
$frontendPidPath = Join-Path $rootDir "frontend.dev.pid"
$backendLogPath = Join-Path $rootDir "backend.dev.log"
$backendErrPath = Join-Path $rootDir "backend.dev.err.log"
$frontendLogPath = Join-Path $rootDir "frontend.dev.log"
$frontendErrPath = Join-Path $rootDir "frontend.dev.err.log"

function Get-ListeningPid {
    param([int]$Port)

    $match = netstat -ano | Select-String ":$Port"
    foreach ($line in $match) {
        $text = $line.ToString().Trim()
        if ($text -match "\s+LISTENING\s+(\d+)$") {
            return $matches[1]
        }
    }
    return $null
}

function Test-RunningPid {
    param([string]$PidPath)

    if (-not (Test-Path $PidPath)) {
        return $null
    }

    $savedPid = Get-Content $PidPath -ErrorAction SilentlyContinue
    if (-not $savedPid) {
        Remove-Item -LiteralPath $PidPath -ErrorAction SilentlyContinue
        return $null
    }

    $process = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    if ($process) {
        return $savedPid
    }

    Remove-Item -LiteralPath $PidPath -ErrorAction SilentlyContinue
    return $null
}

function Start-DevProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$PidPath,
        [string]$LogPath,
        [string]$ErrPath,
        [Nullable[int]]$KnownPort = $null
    )

    if ($KnownPort) {
        $listeningPid = Get-ListeningPid -Port $KnownPort
        if ($listeningPid) {
            Set-Content -Path $PidPath -Value $listeningPid
            Write-Host "$Name da co service dang nghe o cong $KnownPort voi PID $listeningPid"
            return
        }
    }

    $existingPid = Test-RunningPid -PidPath $PidPath
    if ($existingPid) {
        if ($KnownPort) {
            Write-Host "$Name co PID $existingPid nhung cong $KnownPort chua san sang, dang khoi dong lai..."
            Stop-Process -Id $existingPid -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $PidPath -ErrorAction SilentlyContinue
        } else {
            Write-Host "$Name da dang chay voi PID $existingPid"
            return
        }
    }

    Remove-Item -LiteralPath $LogPath, $ErrPath -ErrorAction SilentlyContinue

    $process = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $LogPath `
        -RedirectStandardError $ErrPath `
        -PassThru

    Start-Sleep -Seconds 3

    $runningProcess = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
    if (-not $runningProcess) {
        Write-Host "$Name khoi dong that bai."
        if (Test-Path $ErrPath) {
            Get-Content $ErrPath -Tail 20
        }
        throw "$Name khong the khoi dong."
    }

    Set-Content -Path $PidPath -Value $process.Id
    Write-Host "$Name dang chay voi PID $($process.Id)"
}

Set-Location $rootDir

Write-Host "Khoi dong AI service..."
& (Join-Path $aiDir "start_ai_service.ps1")

Write-Host "Khoi dong backend..."
Start-DevProcess `
    -Name "Backend" `
    -WorkingDirectory $backendDir `
    -PidPath $backendPidPath `
    -LogPath $backendLogPath `
    -ErrPath $backendErrPath `
    -KnownPort 5000

Write-Host "Khoi dong frontend..."
Start-DevProcess `
    -Name "Frontend" `
    -WorkingDirectory $frontendDir `
    -PidPath $frontendPidPath `
    -LogPath $frontendLogPath `
    -ErrPath $frontendErrPath

Write-Host ""
Write-Host "He thong da duoc khoi dong."
Write-Host "AI service: http://127.0.0.1:8001/health"
Write-Host "Backend log: $backendLogPath"
Write-Host "Frontend log: $frontendLogPath"
