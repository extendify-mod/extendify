<h3 align="center">
    <img src="https://avatars.githubusercontent.com/u/206924143?s=200" />
</h3>
<p align="center">
    <img src="https://img.shields.io/github/actions/workflow/status/extendify-mod/extendify/build_mod.yml" />
    <img src="https://img.shields.io/github/actions/workflow/status/extendify-mod/extendify/build_native.yml?label=build%20native" />
    <img src="https://rust-reportcard.xuri.me/badge/github.com/extendify-mod/extendify" />
</p>

---

An easy to install and use mod for the desktop and browser versions of Spotify!

## Supported Platforms:

- [Linux (x64_86)](/docs/install/linux.md)
- [Windows (x64, arm64)](/docs/install/windows.md)
- ~~MacOS (Intel, ARM)~~ Coming soon!
- [Chrome](/docs/install/chrome.md)

## Installation:

***WARNING:*** Don't trust random scripts from the Internet, read them before executing!

### Installing on Linux-based systems

Using Extendify on Linux is pretty straightforward.

The way we inject is through the `LD_PRELOAD` environment variable.
This variable loads a specified `.so` (shared object) file into the process, allowing you to override original exports.

You can download prebuilt shared object [here](https://github.com/extendify-mod/extendify/releases/download/native/linux_x86_64.so) (may be outdated).
Note that builds are only available for the `x64_86` architecture and for glibc!

Then, whenever you run the Spotify app, prefix your command with `LD_PRELOAD=</full/path/to/linux_x86_64.so>` to inject Extendify.
Of course you can simplify this by making an alias for whatever command you use to launch Spotify.

For example:

```bash
LD_PRELOAD=path/to/linux_x86_64.so spotify
```

Alternatievely, [spotify-launcher](https://github.com/kpcyrd/spotify-launcher) can be used to automate this process.
In the `$HOME/.config/spotify-launcher.conf` file, add the following block:

```ini
[spotify]
extra_env_vars = ["LD_PRELOAD=</full/path/to/linux_x86_64.so>"]
```

After that, restart Spotify, and Extendify will be loaded.

### Installing on Windows

#### Automatic installation

To install Extendify automatically, open a PowerShell terminal and run:

```ps1
irm "https://raw.githubusercontent.com/extendify-mod/extendify/refs/heads/master/install.ps1" | iex
```

This fetches our install script from GitHub and automatically executes it.

#### Manual installation

To manually install Extendify, follow the steps:

1. Make sure you have a non-Microsoft Store version of Spotify installed.
1. Download the Native DLL for your system architecture
   (Downloads: [64-bit](https://github.com/extendify-mod/extendify/releases/download/native/windows_x86_64.dll), [arm64](https://github.com/extendify-mod/extendify/releases/download/native/windows_aarch64.dll)) (may be outdated)
1. Place the DLL next to the `Spotify.exe` file. (Most common location is `%AppData%\Spotify`)
1. Rename the DLL to `profapi.dll`
1. Launch/restart Spotify

### Installing as Chrome extension

We don't yet have an official Extension on the Chrome Webstore, so to use Extendify in Chrome, you need build it yourself.

1. Build Extendify with the `--platform=browser` flag enabled. Read the build [here](#building-web-mod).
1. In the browser, navigate to `chrome://extensions`. Enable "developer mode" if it is not enabled.
1. Press `Load Unpacked` and navigating to the `packages/mod/dist` folder.
1. Refresh Spotify or open a new Spotify tab and Extendify will be loaded.

## Building Extendify

Since Extendify is essentially broken up into 2 subprojects
which both use different a different build system, we've separated the guides.

- [Native](#natieve-version), i.e. native to the system, library loading.
- [Mod (The core of Extendify)](#building-web-mod)

Build instructions assumes the use of Arch Linux.

### Native version

#### Step 1: prepare the environment

Install building dependencies:

```bash
sudo pacman -S git python rust
```

Clone the repository:

```bash
git clone https://github.com/extendify-mod/extendify.git
cd extendify
```

Create python virtual environment named "venv" and activate it:

```bash
python -m venv venv
. ./venv/bin/activate
```

Install the `requests` Python dependency:

```bash
pip install requests
```

In order to interface with [CEF](https://chromiumembedded.github.io/cef/) by generating the bindings, you will first need to download it.

Run the script to download CEF:

```bash
python ./crates/extendify-native/scripts/dl_cef.py
```

This script is:
1. Download the latest version of Spotify
1. Extract CEF version and find download link to it's headers
1. Download the headers
1. Remove intermediate files

#### Step 2: build

To build Extendify, run:

```bash
cargo build --package extendify-native --release
```

Notes:
1. Remove `--release` flag to make cargo build an optimized build for debugging.
1. If you are building on Windows, there is a convenience script (./crates/extendify-native/scripts/move.ps1) you can use to move built `.dll` to your Spotify directory.

### Building web mod

This guide will cover how to build the Extendify web mod.

#### Step 1: prepare the environment

Install building dependencies:

```bash
sudo pacman -S git extra/bun
```

Clone the repository:

```bash
git clone https://github.com/extendify-mod/extendify.git
cd extendify
```

Install bun dependencies:

```bash
bun install
```

#### Step 2: build

Build script accepts 2 build types: `build` and `build-dev`.
There is 2 platforms available: `browser` and `desktop`.
To specify the platform to build for, use the `--platform` flag.

```bash
bun -F @extendify/scripts <TYPE> --platform=<PLATFORM>
```

For example:

```bash
bun -F @extendify/scripts build --platform=browser
```

The resulting files should end up in a `dist` folder.

#### Step 3: installation

To use the locally built files with the native loader, create an environment variable called `EXTENDIFY_ROOT`, and set its value to the root of the Extendify repository.
