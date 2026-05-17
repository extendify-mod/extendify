import requests, os 
from sys import platform
from platform import machine

VERSIONS = "https://raw.githubusercontent.com/LoaderSpot/table/refs/heads/main/table/versions.json"

def get_version_arch() -> str:
    arch = machine().lower()

    if platform == "linux":
        if arch == "x86_64":
            return "amd64"
        raise Exception("Only x64 is available on Linux")

    if arch in ["aarch64", "arm64"]:
        return "arm64"
    elif platform == "win32" and arch in ["x86_64", "amd64"]:
        return "x64"
    elif platform == "darwin" and arch == "x86_64":
        return "intel"

    raise Exception(f"No Spotify release available for {platform} with arch {arch}")

def get_version_key() -> str:
    if platform == "darwin":
        return "mac"
    elif platform == "win32":
        return "win"
    elif platform == "linux":
        return "linux"

    raise Exception("Unknown OS")

def get_latest_version() -> str:
    print("Fetching Spotify releases...")

    version_key = get_version_key()
    version_arch = get_version_arch()

    res = requests.get(VERSIONS).json()
    for value in res.values():
        if not version_key in value:
            continue

        version = value[version_key]

        if not version_arch in version:
            continue

        return version[version_arch]["url"]

    raise Exception("No valid download link found")

def download_version(url: str, project_root: str) -> str:
    file_path = os.path.join(project_root, "spotify")

    with open(file_path, "wb") as f:
        print("Downloading Spotify release...")

        res = requests.get(url)

        if res._content is None:
            raise Exception(f"Download request failed with code {res.status_code}")

        f.write(res._content)

    print(f"Wrote Spotify release to {file_path}")

    return file_path
