#Requires -Version 5.1
<#
.SYNOPSIS
    Extendify Uninstaller for Spotify
.DESCRIPTION
    Removes the Extendify native library (profapi.dll) from the Spotify
    installation folder, undoing what install.ps1 did.
#>

$C = @{
    Reset = "`e[0m"
    Bold = "`e[1m"
    Dim = "`e[2m"
    Green = "`e[92m"
    Cyan = "`e[96m"
    Yellow = "`e[93m"
    Red = "`e[91m"
    Magenta = "`e[95m"
    White = "`e[97m"
}

if ((Get-Process -Id $PID).ProcessName -eq "powershell") {
    foreach ($key in @($C.Keys)) { $C[$key] = "" }
}

function Write-Banner {
    Write-Host ""
    Write-Host "  $($C.Magenta)$($C.Bold)███████╗██╗  ██╗████████╗███████╗███╗   ██╗██████╗ ██╗███████╗██╗   ██╗$($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝████╗  ██║██╔══██╗██║██╔════╝╚██╗ ██╔╝$($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)█████╗   ╚███╔╝    ██║   █████╗  ██╔██╗ ██║██║  ██║██║█████╗   ╚████╔╝ $($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║╚██╗██║██║  ██║██║██╔══╝    ╚██╔╝  $($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)███████╗██╔╝ ██╗   ██║   ███████╗██║ ╚████║██████╔╝██║██║        ██║   $($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝        ╚═╝   $($C.Reset)"
    Write-Host ""
    Write-Host "  $($C.Dim)$($C.White)Spotify Mod Uninstaller - github.com/extendify-mod/extendify$($C.Reset)"
    Write-Host "  $($C.Dim)──────────────────────────────────────────────────$($C.Reset)"
    Write-Host ""
}

function Write-Step {
    param([int]$Num, [string]$Text)
    Write-Host "  $($C.Cyan)$($C.Bold)[$Num]$($C.Reset) $($C.White)$Text$($C.Reset)"
}

function Write-Info { param([string]$Msg) Write-Host "      $($C.Dim)$($C.White)→ $Msg$($C.Reset)" }
function Write-Ok { param([string]$Msg) Write-Host "      $($C.Green)✔  $Msg$($C.Reset)" }
function Write-Warn { param([string]$Msg) Write-Host "      $($C.Yellow)⚠  $Msg$($C.Reset)" }
function Write-Err { param([string]$Msg) Write-Host "      $($C.Red)✖  $Msg$($C.Reset)" }

function Prompt-YesNo {
    param([string]$Question)
    while ($true) {
        Write-Host -NoNewline "      $($C.Yellow)$Question $($C.Dim)[y/n]$($C.Reset) "
        $ans = (Read-Host).Trim().ToLower()
        if ($ans -eq 'y') { return $true  }
        if ($ans -eq 'n') { return $false }
        Write-Warn "Please type y or n."
    }
}

# Start
Write-Banner

# Close Spotify if running (a locked file can't be deleted)
Write-Step 1 "Checking if Spotify is running…"

$spotifyProc = Get-Process -Name "Spotify" -ErrorAction SilentlyContinue
if ($spotifyProc) {
    Write-Warn "Spotify is currently running."
    $close = Prompt-YesNo "Close Spotify before continuing?"
    if ($close) {
        Get-Process -Name "Spotify" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Milliseconds 500
        Write-Ok "Spotify closed."
    }
    else {
        Write-Err "Cannot safely remove the DLL while Spotify is running (file may be locked)."
        exit 1
    }
}
else {
    Write-Ok "Spotify is not running."
}

Write-Host ""

# Locate and remove the DLL(s)
# Older versions of Extendify used version.dll instead of profapi.dll,
# so both names are checked and removed if present.
Write-Step 2 "Looking for the Extendify native library…"

$spotifyDir = Join-Path $env:AppData "Spotify"
$dllNames = @("profapi.dll", "version.dll")

$foundAny = $false

foreach ($dllName in $dllNames) {
    $dllDest = Join-Path $spotifyDir $dllName
    Write-Info "Checking: $dllDest"

    if (Test-Path $dllDest) {
        $foundAny = $true
        Write-Ok "Found $dllName."

        try {
            Remove-Item -Path $dllDest -Force -ErrorAction Stop
            Write-Ok "Removed $dllName."
        }
        catch {
            Write-Err "Failed to remove ${dllName}: $_"
            Write-Info "You may need to close Spotify completely (check the system tray) and try again."
            exit 1
        }
    }
}

if (-not $foundAny) {
    Write-Warn "No Extendify DLL found — nothing to uninstall."
}

Write-Host ""

# Done
Write-Host "  $($C.Green)$($C.Bold)╔══════════════════════════════════════╗$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)║                                      ║$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)║   ✔  Extendify has been removed.     ║$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)║                                      ║$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)╚══════════════════════════════════════╝$($C.Reset)"
Write-Host ""
Write-Host "  $($C.Dim)Spotify itself was left installed — only the mod DLL was removed.$($C.Reset)"
Write-Host ""
