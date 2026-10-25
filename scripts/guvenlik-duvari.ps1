# Telefonlarin kasa bilgisayarina baglanabilmesi icin Windows ayarlari.
# YONETICI olarak calistirin:
#   Baslat > "PowerShell" yazin > sag tik > "Yonetici olarak calistir"
#   cd C:\Users\uyaal\Desktop\toscana
#   powershell -ExecutionPolicy Bypass -File scripts\guvenlik-duvari.ps1

$ErrorActionPreference = 'Stop'

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Bu betik yonetici olarak calistirilmali (PowerShell > sag tik > Yonetici olarak calistir).'
}

# 1) Ag turunu "Ozel" yap: "Ortak" aglarda Windows disaridan gelen baglantilari engeller.
Get-NetConnectionProfile | ForEach-Object {
  if ($_.NetworkCategory -ne 'Private') {
    Set-NetConnectionProfile -InterfaceIndex $_.InterfaceIndex -NetworkCategory Private
    Write-Host "Ag turu Ozel yapildi: $($_.Name)"
  } else {
    Write-Host "Ag zaten Ozel: $($_.Name)"
  }
}

# 2) 3000 (canli) ve 5173 (gelistirme) portlarina gelen baglantilara izin ver.
$ruleName = 'Toscana Ristorante (3000, 5173)'
Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 3000,5173 -Action Allow -Profile Private,Domain | Out-Null
Write-Host "Guvenlik duvari kurali eklendi: TCP 3000, 5173"

# 3) Telefonda yazilacak adresler
Write-Host ''
Write-Host 'Telefonda Safari/Chrome adres cubuguna yazin:'
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } |
  ForEach-Object {
    Write-Host ("  http://{0}:5173/giris   (gelistirme, npm run dev)  [{1}]" -f $_.IPAddress, $_.InterfaceAlias)
    Write-Host ("  http://{0}:3000/giris   (canli, npm start)" -f $_.IPAddress)
  }
