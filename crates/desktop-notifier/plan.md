# DOWNLOAD

https://download.scdn.co/SpotifyARM64.dmg

# GET VERSION

```
strings Spotify/Spotify.app/MacOS/Spotify | grep -E 'g[0-9a-f]{7,}'
```

yields

```
1.2.96.518.g366879e1
cef_146.0.10+g8219561+chromium-146.0.7680.179
```

# EXTRACT

Spotify/Spotify.app/Resources/Apps/xpui.spa

- i18n/en.json
- ui-licenses.html
