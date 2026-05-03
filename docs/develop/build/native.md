## Build: Native

This guide will cover how to build Extendify Native.

This guide assumes you have cloned the Extendify repository and your working directory is at the root of said repository.

This guide assumes you have the following programs installed:

- [Rust](https://rust-lang.org/)
- Cargo
- [Python](https://python.org)

---

### Step 1

In order to interface with [CEF](https://chromiumembedded.github.io/cef/), you will first need to download it.

First, download the `requests` Pythond dependency like so:

```bash
$ python -m pip install requests
```

Then, run the download script:

```bash
$ python ./packages/native/scripts/dl_cef.py
```

### Step 2

If you want to build Extendify Native in development mode, run the following command:

```bash
$ cargo build
```

If you want to build Extendify Native in release mode, run the following command:

```bash
$ cargo build --release
```

If you're on Windows, there's a convenient script you can use to move the built `.dll` to your Spotify directory.

```bash
$ ./packages/native/scripts/move.ps1
```

If you're not on Windows and you're unsure about how to use the built file, refer to [the native installation guide](../../install)

