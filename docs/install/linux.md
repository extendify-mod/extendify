## Install: Linux

Using Extendify on Linux is pretty straightforward.

The way we inject is through the `LD_PRELOAD` environment variable.
This variable allows you to load a `.so` (shared object) file into the process,
allowing you to override original exports.

You can download our `.so` file [here](https://github.com/extendify-mod/extendify/releases/download/native/linux_x86_64.so).
Note that builds are only available for the `x64` architecture,
since that's the only architecture Spotify for Linux supports.

Then, whenever you run the Spotify app, prefix your command with `LD_PRELOAD=path/to/linux_x86_64.so`
to inject Extendify. Of course you can simplify this by making an alias for whatever command you use to launch Spotify.

---

Here is an example on how to run Spotify with Extendify on [Arch Linux](https://archlinux.org) using [spotify-launcher](https://github.com/kpcyrd/spotify-launcher):

```bash
$ LD_PRELOAD=path/to/linux_x86_64.so spotify-launcher
```

Better yet, we can make a configuration file to automate this for us.

> `~/.config/spotify-launcher.conf`
```
[spotify]
extra_env_vars = ["LD_PRELOAD=path/to/linux_x86_64.so"]
```

Then we can just run

```bash
$ spotify-launcher
```

and we'll be injected!

