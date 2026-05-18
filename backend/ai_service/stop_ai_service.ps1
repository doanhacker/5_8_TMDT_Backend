$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidPath = Join-Path $scriptDir "ai_service.pid"

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

if (-not (Test-Path $pidPath)) {
    $discoveredPid = Get-AiServicePid
    if (-not $discoveredPid) {
        Write-Host "Khong tim thay file PID. AI service co the da dung."
        exit 0
    }
    Set-Content -Path $pidPath -Value $discoveredPid
}

$servicePid = Get-Content $pidPath -ErrorAction SilentlyContinue
if (-not $servicePid) {
    Remove-Item -LiteralPath $pidPath -ErrorAction SilentlyContinue
    Write-Host "PID khong hop le, da xoa file pid."
    exit 0
}

$process = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
if (-not $process) {
    Remove-Item -LiteralPath $pidPath -ErrorAction SilentlyContinue
    Write-Host "Tien trinh $servicePid khong con chay. Da xoa file pid."
    exit 0
}

Stop-Process -Id $servicePid
Remove-Item -LiteralPath $pidPath -ErrorAction SilentlyContinue
Write-Host "Da dung AI service voi PID $servicePid"
