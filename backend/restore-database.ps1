param(
    [string]$MySqlExe = "C:\xampp\mysql\bin\mysql.exe",
    [string]$User = "root",
    [string]$Password = "",
    [string]$DbHost = "localhost",
    [int]$Port = 3306
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbDir = Join-Path $scriptDir 'database'

$files = @(
    'init.sql',
    'alter_tables_1.1.sql',
    'after_table_1.2.sql',
    'after_table_1.3.sql',
    'after_table_1.4.sql',
    'after_table_1.5.sql',
    'after_table_1.6.sql',
    'after_table_1.7.sql',
    'after_table_1.8.sql',
    'add-password-reset-codes.sql',
    'seed.sql'
)

if (-not (Test-Path -LiteralPath $MySqlExe)) {
    throw "Cannot find mysql.exe at: $MySqlExe. Pass -MySqlExe with the correct path to your XAMPP MySQL client."
}

foreach ($file in $files) {
    $sqlPath = Join-Path $dbDir $file
    if (-not (Test-Path -LiteralPath $sqlPath)) {
        throw "Missing SQL file: $sqlPath"
    }
}

Write-Host 'Restoring laptop_ecommerce_db from repo SQL files...' -ForegroundColor Cyan
Write-Host "MySQL client: $MySqlExe" -ForegroundColor DarkGray

$mysqlArgs = @('--host', $DbHost, '--port', $Port, '--user', $User)
if ($Password -ne '') {
    $mysqlArgs += "--password=$Password"
}

foreach ($file in $files) {
    $sqlPath = Join-Path $dbDir $file
    Write-Host "Importing $file ..." -ForegroundColor Yellow
    $sqlText = Get-Content -LiteralPath $sqlPath -Raw
    if ($file -ne 'init.sql') {
        $sqlText = "USE laptop_ecommerce_db;`n$sqlText"
    }

    $sqlText | & $MySqlExe @mysqlArgs
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL import failed while processing: $file"
    }
}

Write-Host 'Database restore completed successfully.' -ForegroundColor Green
