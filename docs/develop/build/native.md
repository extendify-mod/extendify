## Build: Native

This guide will cover how to build Extendify Native.

This guide assumes you have cloned the Extendify repository and your working directory is at the root of said repository.

This guide assumes you have the following programs installed:

- [Rust](https://rust-lang.org/)
- Cargo
- [Python](https://python.org)

---

### Step 1

In order to interface with [CEF](https://chromiumembedded.github.io/cef/) by generating the bindings, you will first need to download it.

First, install the `requests` Python dependency like so:

```bash
$ python -m pip install requests
```

Then, run the download script:

```bash
$ python ./crates/extendify-native/scripts/dl_cef.py
```

This script downloads the latest version of Spotify for your system,
then extracts the CEF version, finds it in the CEF releases,
and then downloads those headers and binaries. (Everything except the needed files is cleaned up at the end)

### Step 2

If you want to build Extendify Native in debug mode, run the following command:

```bash
$ cargo build --package extendify-native
```

If you want to build Extendify Native in release mode, run the following command:

```bash
$ cargo build --package extendify-native --release
```

### Step 3

If you're building in debug mode on Windows, there's a convenient script you can use to move the built `.dll` to your Spotify directory.

```bash
$ ./crates/extendify-native/scripts/move.ps1
```

If you're not on Windows and you're unsure about how to use the built file, refer to [the installation guide](../../install).
