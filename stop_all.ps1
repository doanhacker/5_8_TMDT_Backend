$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $rootDir "backend\ai_service"
$backendPidPath = Join-Path $rootDir "backend.dev.pid"
$frontendPidPath = Join-Path $rootDir "frontend.dev.pid"

function Stop-ManagedProcess {
    param(
        [string]$Name,
        [string]$PidPath
    )

    if (-not (Test-Path $PidPath)) {
        Write-Host "$Name khong co file PID."
        return
    }

    $savedPid = Get-Content $PidPath -ErrorAction SilentlyContinue
    if (-not $savedPid) {
        Remove-Item -LiteralPath $PidPath -ErrorAction SilentlyContinue
        Write-Host "$Name co PID khong hop le, da xoa file pid."
        return
    }

    $process = Get-Process -Id $savedPid -ErrorAction SilentlyContinue
    if (-not $process) {
        Remove-Item -LiteralPath $PidPath -ErrorAction SilentlyContinue
        Write-Host "$Name khong con chay. Da xoa file pid."
        return
    }

    Stop-Process -Id $savedPid
    Remove-Item -LiteralPath $PidPath -ErrorAction SilentlyContinue
    Write-Host "Da dung $Name voi PID $savedPid"
}

Set-Location $rootDir

Stop-ManagedProcess -Name "Frontend" -PidPath $frontendPidPath
Stop-ManagedProcess -Name "Backend" -PidPath $backendPidPath
& (Join-Path $aiDir "stop_ai_service.ps1")

Write-Host "Da dung toan bo he thong."
