#Requires -Version 5.1
<#
.SYNOPSIS
    Extendify Installer for Spotify
.DESCRIPTION
    Downloads and installs the Extendify mod for Spotify on Windows.
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
    BgGreen = "`e[42m"
    BgBlue = "`e[44m"
}

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  $($C.Magenta)$($C.Bold)███████╗██╗  ██╗████████╗███████╗███╗   ██╗██████╗ ██╗███████╗██╗   ██╗$($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝████╗  ██║██╔══██╗██║██╔════╝╚██╗ ██╔╝$($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)█████╗   ╚███╔╝    ██║   █████╗  ██╔██╗ ██║██║  ██║██║█████╗   ╚████╔╝ $($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)██╔══╝   ██╔██╗    ██║   ██╔══╝  ██║╚██╗██║██║  ██║██║██╔══╝    ╚██╔╝  $($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)███████╗██╔╝ ██╗   ██║   ███████╗██║ ╚████║██████╔╝██║██║        ██║   $($C.Reset)"
    Write-Host "  $($C.Magenta)$($C.Bold)╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝        ╚═╝   $($C.Reset)"
    Write-Host ""
    Write-Host "  $($C.Dim)$($C.White)Spotify Mod Installer - github.com/extendify-mod$($C.Reset)"
    Write-Host "  $($C.Dim)────────────────────────────────────────────────$($C.Reset)"
    Write-Host ""
}

function Write-Step {
    param([int]$Num, [string]$Text)
    Write-Host "  $($C.Cyan)$($C.Bold)[$Num]$($C.Reset) $($C.White)$Text$($C.Reset)"
}

function Write-Info  { param([string]$Msg) Write-Host "      $($C.Dim)$($C.White)→ $Msg$($C.Reset)" }
function Write-Ok    { param([string]$Msg) Write-Host "      $($C.Green)✔  $Msg$($C.Reset)" }
function Write-Warn  { param([string]$Msg) Write-Host "      $($C.Yellow)⚠  $Msg$($C.Reset)" }
function Write-Err   { param([string]$Msg) Write-Host "      $($C.Red)✖  $Msg$($C.Reset)" }

function Write-ProgressBar {
    param(
        [int] $Percent,
        [string] $Label = "",
        [int] $Width = 40
    )
    $filled = [int]([Math]::Round($Percent / 100 * $Width))
    $empty = $Width - $filled
    $bar = ("█" * $filled) + ("░" * $empty)
    $pct = "$Percent%".PadLeft(4)
    Write-Host -NoNewline "`r      $($C.Cyan)$bar$($C.Reset) $($C.Bold)$pct$($C.Reset)  $($C.Dim)$Label$($C.Reset)   "
}

function Write-FakeProgress {
    param([string]$Label = "Working…", [int]$DurationMs = 2000, [int]$Steps = 50)
    $delay = [int]($DurationMs / $Steps)
    for ($i = 0; $i -le $Steps; $i++) {
        Write-ProgressBar -Percent ([int]($i / $Steps * 100)) -Label $Label
        Start-Sleep -Milliseconds $delay
    }
    Write-Host ""
}

function Write-DownloadProgress {
    param([string]$Url, [string]$Dest, [string]$Label)
 
    Write-Host ""
 
    try {
        $req = [System.Net.HttpWebRequest]::Create($Url)
        $req.Method = "HEAD"
        $req.AllowAutoRedirect = $true
        $resp = $req.GetResponse()
        $totalBytes = $resp.ContentLength
        $resp.Close()
 
        $req2 = [System.Net.HttpWebRequest]::Create($Url)
        $req2.AllowAutoRedirect = $true
        $resp2 = $req2.GetResponse()
        $stream = $resp2.GetResponseStream()
        $fs = [System.IO.File]::Create($Dest)
 
        $buf = New-Object byte[] 8192
        $received = 0
 
        while ($true) {
            $read = $stream.Read($buf, 0, $buf.Length)
            if ($read -le 0) { break }
            $fs.Write($buf, 0, $read)
            $received += $read
            if ($totalBytes -gt 0) {
                $pct = [int]($received / $totalBytes * 100)
                Write-ProgressBar -Percent $pct -Label $Label
            }
        }
 
        $fs.Close()
        $stream.Close()
        $resp2.Close()
 
        Write-ProgressBar -Percent 100 -Label $Label
        Write-Host ""
    }
    catch {
        Write-Host ""
        throw $_
    }
}

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

function Get-Architecture {
    $arch = (Get-CimInstance Win32_OperatingSystem).OSArchitecture
    if ($arch -match "ARM") {
        # Distinguish ARM64 from ARM32
        if ([Environment]::Is64BitOperatingSystem) { return "arm64" }
        else { return "arm32" }
    }
    if ([Environment]::Is64BitOperatingSystem) { return "x64" }
    return "x86"
}

# Start
Write-Banner

# 32 bit check
Write-Step 1 "Checking system architecture…"
$arch = Get-Architecture
Write-Info "Detected: $arch"

if ($arch -eq "x86") {
    Write-Host ""
    Write-Err "Extendify doesn't support 32-bit installations of Spotify."
    Write-Host ""
    Write-Host "  $($C.Yellow)Our recommendation is to install an older 32-bit Spotify with Spicetify:$($C.Reset)"
    Write-Host ""
    Write-Host "    $($C.Cyan)· Old Spotify builds (x86):$($C.Reset)"
    Write-Host "      $($C.White)https://loadspot.pages.dev/versions?os=win&arch=x86&sortVersion=desc$($C.Reset)"
    Write-Host ""
    Write-Host "    $($C.Cyan)· Spicetify (mod loader):$($C.Reset)"
    Write-Host "      $($C.White)https://spicetify.app/$($C.Reset)"
    Write-Host ""
    exit 1
}

Write-Ok "Architecture OK ($arch)"
Write-Host ""

# MS store check
Write-Step 2 "Checking for Microsoft Store version of Spotify…"

$storeApp = Get-AppxPackage -Name "SpotifyAB.SpotifyMusic" -ErrorAction SilentlyContinue

if ($storeApp) {
    Write-Warn "Found Spotify from the Microsoft Store (v$($storeApp.Version))."
    Write-Host ""

    $uninstall = Prompt-YesNo "Uninstall the Store version before continuing?"

    if ($uninstall) {
        Write-Info "Uninstalling Store Spotify…"
        Write-FakeProgress -Label "Removing package…" -DurationMs 2500

        try {
            $storeApp | Remove-AppxPackage -ErrorAction Stop
            Write-Ok "Microsoft Store Spotify removed."
        }
        catch {
            Write-Err "Could not remove Store Spotify automatically."
            Write-Info "Please uninstall it manually via Settings → Apps, then re-run this script."
            Write-Host ""
            exit 1
        }
    }
    else {
        Write-Warn "Skipping uninstall. You may end up with two Spotify installations."
        Write-Warn "If anything breaks, remove the Store version and reinstall via this script."
    }
}
else {
    Write-Ok "No Microsoft Store Spotify found."
}

Write-Host ""

# Install spotify
Write-Step 3 "Downloading Spotify installer…"

$spotifySetup = Join-Path $env:TEMP "SpotifySetup.exe"
$spotifyUrl = "https://download.scdn.co/SpotifySetup.exe"

try {
    Write-DownloadProgress -Url $spotifyUrl -Dest $spotifySetup -Label "SpotifySetup.exe"
    Write-Ok "Download complete."
}
catch {
    Write-Err "Failed to download Spotify: $_"
    exit 1
}

Write-Host ""
Write-Info "Launching Spotify installer…"
Write-Host ""

try {
    $proc = Start-Process -FilePath $spotifySetup -PassThru
    Write-Info "Waiting for installer to finish…"

    $spinner = @('⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏')
    $i = 0
    while (-not $proc.HasExited) {
        Write-Host -NoNewline "`r      $($C.Cyan)$($spinner[$i % $spinner.Count])$($C.Reset)  $($C.Dim)Installer running…$($C.Reset)   "
        Start-Sleep -Milliseconds 120
        $i++
    }
    Write-Host "`r      $($C.Green)✔  Installer finished.                $($C.Reset)"

    Get-Process -Name "Spotify" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Ok "Spotify closed."
}
catch {
    Write-Err "Could not launch installer: $_"
    exit 1
}

Write-Host ""

# Download native
Write-Step 4 "Downloading Extendify native library…"

$dllUrls = @{
    "x64" = "https://github.com/extendify-mod/extendify/releases/download/native/windows_x86_64.dll"
    "arm64" = "https://github.com/extendify-mod/extendify/releases/download/native/windows_aarch64.dll"
}

if (-not $dllUrls.ContainsKey($arch)) {
    Write-Err "Unsupported architecture '$arch' — this shouldn't happen. Please open an issue."
    exit 1
}

$dllUrl  = $dllUrls[$arch]
$dllDest = Join-Path $env:AppData "Spotify\version.dll"
$dllDir  = Split-Path $dllDest

Write-Info "Architecture: $arch"
Write-Info "Destination: $dllDest"

if (-not (Test-Path $dllDir)) {
    Write-Warn "Spotify folder not found at $dllDir"
    Write-Info "Creating directory…"
    New-Item -ItemType Directory -Path $dllDir -Force | Out-Null
}

try {
    Write-DownloadProgress -Url $dllUrl -Dest $dllDest -Label "version.dll ($arch)"
    Write-Ok "Extendify DLL installed."
}
catch {
    Write-Err "Failed to download Extendify DLL: $_"
    exit 1
}

Remove-Item -Path $spotifySetup -Force -ErrorAction SilentlyContinue

Write-Host ""

# Done
Write-Host "  $($C.Green)$($C.Bold)╔══════════════════════════════════════╗$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)║                                      ║$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)║   ✔  Success! Enjoy the mod :^]      ║$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)║                                      ║$($C.Reset)"
Write-Host "  $($C.Green)$($C.Bold)╚══════════════════════════════════════╝$($C.Reset)"
Write-Host ""
Write-Host "  $($C.Dim)Launch Spotify and the mod will load automatically.$($C.Reset)"
Write-Host ""
