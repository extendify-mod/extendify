## Build: Mod

This guide will cover how to build the Extendify mod.

This guide assumes you have cloned the Extendify repository and your working directory is at the root of said repository.

This guide assumes you have the following programs installed:

- [bun](https://bun.sh)

---

### Step 1

To install all dependencies, run the following command:

```bash
$ bun install
```

### Step 2

If you want to build Extendify in development mode, run the following command:

```bash
$ bun -F @extendify/scripts build-dev
```

If you want to build Extendify in production mode, run the following command:

```bash
$ bun -F @extendify/scripts build
```

To specify the platform you want to build for, include the `--platform` flag like so:

```bash
$ bun -F @extendify/scripts build --platform=browser
```

### Step 3

To use the locally built files with the native loader, create an environment variable called `EXTENDIFY_ROOT`,
and set its value to the root of the Extendify repository.

We used to support patching `xpui.spa` with these locally built files just like Spicetify,
but since introducing Extendify Native our build system no longer supports this.
This method would also break for every Spotify update.

---

The resulting files should end up in a `dist` folder. If you're building Extendify for Chrome, continue with the [Chrome installation guide](../../install/chrome.md)
