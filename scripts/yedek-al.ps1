# Toscana veritabani yedegi (pg_dump, ozel bicim).
# Kullanim:  powershell -ExecutionPolicy Bypass -File scripts\yedek-al.ps1
# Farkli klasor: powershell -ExecutionPolicy Bypass -File scripts\yedek-al.ps1 -Hedef "D:\ToscanaYedek"
# Geri yukleme: pg_restore -h 127.0.0.1 -U postgres -d toscana --clean dosya.dump

param(
  [string]$Hedef = 'C:\ToscanaYedek',
  [int]$GunSakla = 30
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root 'server\.env'
if (-not (Test-Path $envFile)) { throw "server\.env bulunamadi: $envFile" }

$line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $line) { throw 'server\.env icinde DATABASE_URL yok' }
$url = ($line -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"')

$uri = [System.Uri]$url
$userParts = $uri.UserInfo.Split(':', 2)
$user = [System.Uri]::UnescapeDataString($userParts[0])
$password = ''
if ($userParts.Count -gt 1) { $password = [System.Uri]::UnescapeDataString($userParts[1]) }
$database = $uri.AbsolutePath.TrimStart('/')
$port = 5432
if ($uri.Port -gt 0) { $port = $uri.Port }

$pgDump = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
  Sort-Object { [int]($_.Directory.Parent.Name -replace '[^0-9]', '') } -Descending |
  Select-Object -First 1
if (-not $pgDump) { throw 'pg_dump.exe bulunamadi. PostgreSQL kurulu mu?' }

New-Item -ItemType Directory -Force -Path $Hedef | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$file = Join-Path $Hedef "toscana_$stamp.dump"

$env:PGPASSWORD = $password
try {
  & $pgDump.FullName -h $uri.Host -p $port -U $user -F c -f $file $database
  if ($LASTEXITCODE -ne 0) { throw "pg_dump hata verdi (kod $LASTEXITCODE)" }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Get-ChildItem $Hedef -Filter 'toscana_*.dump' |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$GunSakla) } |
  Remove-Item

Write-Host "Yedek alindi: $file"
