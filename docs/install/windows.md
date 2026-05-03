## Install: Windows

There are 2 ways to install Extendify on Windows:

- [Automatically](#Automatic): A single PowerShell command;
- [Manually](#Manual): Requires you to go through a couple more steps.

---

### Automatic

To install Extendify automatically, open a PowerShell terminal and run the following snippet:

```ps1
irm "https://raw.githubusercontent.com/extendify-mod/extendify/refs/heads/master/install.ps1" | iex
```

This fetches our install script from GitHub and automatically executes it.

We assure you this is safe to run. If you don't want to run this script you can follow the [manual method](#Manual).

---

### Manual

To manually install Extendify, you must do the following:

1. Make sure you have a non-Microsoft Store version of Spotify installed. ([Download link](https://download.scdn.co/SpotifySetup.exe))
2. Download the Native DLL for your system architecture.
   (Downloads: [x64](https://github.com/extendify-mod/extendify/releases/download/native/windows_x86_64.dll), [arm64](https://github.com/extendify-mod/extendify/releases/download/native/windows_aarch64.dll))
3. Place said DLL next to the `Spotify.exe` file. (Found at `%AppData%\Spotify`)
4. Launch Spotify
