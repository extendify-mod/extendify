# Extendify (WIP)

Enhance your Spotify experience with custom plugins.

The best [Spicetify](https://spicetify.app) alternative in [a familiar way](https://vencord.dev).

Join the official Extendify [Discord server](https://discord.gg/eWD5BahyBm)!

# Project Status

For this project to continue, the native part of Extendify needs to be completed.
This is being developed by [1 person](https://github.com/sadan4) and will therefore take a while.
The native part of Extendify will allow us to hook into Spotify's executable which will open up many possibilities
for plugins regarding playback and other things that are not controlled by the frontend.
An example of this is changing the playback speed. We are currently not able to do this because audio is played from the application process.

Right now on the frontend side of things we need to implement trivial things
like being able to add options to context menus among other things, which will open a lot more doors for new plugins.

The TL;DR is that we're working on it. You can join the [Discord server](https://discord.gg/eWD5BahyBm) to keep up with progress if you want to.

# Inspirations

This project was largely inspired by [Vencord](https://vencord.dev).
A large part of this codebase is just a modified version of Vencord.
I've added a banner crediting the original source for every file where this is the case.

I also took inspiration from [Spicetify](https://spicetify.app). I just thought that there was a better way to do things.

# Running

If you're on Windows, Extendify requires installing Spotify from the installer. (**NOT THE MICROSOFT STORE!**)

If you already have Spotify installed through this method, your install is probably not up to date, even if you're technically on the latest version.
Read the [Manual Updating](#manual-updating) section to learn how to update properly.

Currently the [`applyPatch.mjs`](/scripts/patch/applyPatch.mjs) script supports Windows, Linux and MacOS (tested on Win11, Arch and an arm Mac Mini).

One thing is that for loading the entrypoint we reference [hardcoded variables](/src/webpack/loader.ts). Linux versions will always be behind MacOS and Windows, so if these change between versions it won't work on Linux until it's caught up. You can change these to test or make a fix for this but I don't have access to testing that stuff right now so I will leave it to someone else.

## Manual Updating

The idea of manual updating is that you delete the `.spa` files in the `Apps` folder of the Spotify install, and the Spotify executable, and then re-run the installer.
This solves our problem of out of date archives 99.9% of the time.

We have a script for this which you can run:

```bash
npm run update
```

This script currently only supports Windows (tested on Win11).
For more info on how to run scripts, read the [Scripts](#scripts) section.

If you're not using Windows, or you want to do it manually, do the following

- Delete the `xpui.spa` and `_xpui.spa` files from the `Spotify/Apps` directory,
- Delete the Spotify executable (`Spotify.exe` on Windows) file from the `Spotify` folder,
- Get the latest installer for your OS and architecture from [here](https://loadspot.pages.dev/),
- Run the installer.

## Scripts:

- `npm run dev`: Build, enable devtools, patch and run Spotify.
- `npm run build`: Build Extendify.
- `npm run devtools`: Enable devtools for Spotify.
- `npm run patch`: Patch Spotify.

## OPTIONAL Flags:

- `--flatpak`: Use this flag when running on Linux with flatpak.
- `--spotifyPath`: Use this flag to specify the path to Spotify's installation directory. (It should contain an `Apps` folder)
- `--cachePath`: Use this flag to specify the path to the cache directory. (It should contain an `offline.bnk` file)

Apply flags like this:

```bash
$ npm [flags] run <script>
```

---

To build, enable devtools and patch Spotify, run:

```bash
$ npm run dev
```

To undo the patch, run:

```bash
$ npm run update
```

# Running (Linux + flatpak)

```bash
$ npm --flatpak run dev
```

To undo the patch, run:

```bash
$ npm --flatpak run update
```

# Screenshots

![Plugins page](<assets/Screenshot 2025-02-10 224528.png>)

![Plugin modal](<assets/Screenshot 2025-02-10 224410.png>)
