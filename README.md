# Extendify

Enhance your Spotify experience with custom plugins!

Join the official Extendify [Discord server](https://discord.gg/eWD5BahyBm)!

Extendify is not affiliated with Spotify.

# Inspirations

This project was largely inspired by [Vencord](https://vencord.dev).

I've tried to make it so the systems used in Extendify write similar to Vencord's systems,
so that they are easy to understand and make plugins if you have previous Vencord experience.

I also took inspiration from [Spicetify](https://spicetify.app). I just thought that there was a better way to do things.

# Installing

Currently, Extendify requires you to download Spotify from the official installer. Not from the Microsoft Store.
If you have a Microsoft Store installation, uninstall it before proceeding.

First, we need to update our Spotify installation.
You'll need to do this any time your Spotify installation gets updated or breaks.
The latter just happens randomly if you restart the app too many times in a row.
If you're on Windows, run the following command:

```bash
$ bun run update
```

If you're on any other operating system, you will need to follow the instructions in [the update script](./scripts/update.ts).
(If you have time you can also make a PR implementing it for your OS).

Then, to install Extendify to your Spotify installation, run the following command:

```bash
$ bun run prod
```

Or, if you want to access development features, run the following command:

```bash
$ bun run dev
```

## Optional Flags

These scripts assume some filepaths. If you're on Linux these will likely be incorrect.
To fix this we have the following optional flags.

- `--spotifyPath`: Use this flag to specify the path to Spotify's installation directory. (It should contain an `Apps` folder)
- `--cachePath`: Use this flag to specify the path to the cache directory. (It should contain an `offline.bnk` file)

Apply the flags like this:

```bash
$ bun run <script> [flags]
```

# Screenshots

![Plugins page](<assets/plugins page.png>)
![Plugin modal](<assets/plugin modal.png>)
