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

The way we load and patch webpack modules also needs to be rewritten to allow for better access to components,
as right now there's not much we can patch or access.
A big problem with the current system is that dedicated modules (ones that are exported by a file, like the Now Playing view) only export their final component,
meaning all their child functions, variables and components are not available to us.

For example, if you want to add an "About the artist" section for every artist on a song in the Now Playing view you would need access to the component that creates
the grid of boxes in the Now Playing view, but you would also (optionally, as you could just recreate this, but it's not preferred) need access to the About the artist component.
The problem is that these specific individual components are not exported as webpack modules. The only thing that gets exported is the final Now Playing view,
which is then imported and rendered by Spotify's private bootstrap function.

Finally, we need to implement trivial things like being able to add options to context menus among other things, which will open a lot more doors for new plugins.
If you're able to create a plugin with the current limitations, make a PR!

The TL;DR is that we're working on it. You can join the [Discord server](https://discord.gg/eWD5BahyBm) to keep up with progress if you want to.

# Inspirations

This project was largely inspired by [Vencord](https://vencord.dev).
A large part of this codebase is just a modified version of Vencord.
I've added a banner crediting the original source for every file where this is the case.

I also took inspiration from [Spicetify](https://spicetify.app). I just thought that there was a better way to do things.

# Running

If you're on Windows, Extendify requires installing Spotify from the installer. (**NOT THE MICROSOFT STORE!**)

If you already have Spotify installed through this method, your install is probably not up to date, even if you're technically on the latest version.
See the next section for info on how to manually update your install.

Currently the `applyPatch.mjs` script supports Windows and Linux (tested on Arch + Hyprland).

## Manual Updating

The idea of manual updating is that you delete the `.spa` files in the `Apps` folder of the Spotify install and then re-run the installer.
This solves our problem of out of date archives 99.9% of the time.

You can get the latest installer from [here (Windows + MacOS + Linux)](https://loadspot.pages.dev/) or [here (Windows only)](https://download.scdn.co/SpotifySetup.exe).

## Scripts:

- `npm run build`: Build Extendify.
- `npm run dev`: Build, enable devtools and patch Spotify.
- `npm run patch`: Patch Spotify.
- `npm run unpatch`: Undo the patch.

## Flags:

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
$ npm run unpatch
```

# Running (Linux + flatpak)

```bash
$ npm --flatpak run dev
```

To undo the patch, run:

```bash
$ npm --flatpak run unpatch
```

# Screenshots

![Plugins page](<assets/Screenshot 2025-02-10 224528.png>)

![Plugin modal](<assets/Screenshot 2025-02-10 224410.png>)
