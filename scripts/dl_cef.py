import re, requests, os, tarfile, subprocess, shutil
from sys import platform
from platform import machine

VERSIONS = "https://raw.githubusercontent.com/LoaderSpot/table/refs/heads/main/table/versions.json"
LIBCEF_REGEX = re.compile(r"\d+\.\d+\.\d+\+g[a-f0-9]+\+chromium-\d+\.\d+\.\d+\.\d+")
CEF_CDN = "https://cef-builds.spotifycdn.com"
CEF_BUILDS = f"{CEF_CDN}/index.json"

def get_cef_os() -> str:
    is_mac = platform == "darwin"
    result = platform.lower()
    if is_mac:
        result = "macos"
    elif platform == "win32":
        result = "windows"

    arch = machine().lower()
    if arch in ["x86_64", "amd64"]:
        result += ("x" if is_mac else "") + "64"
    elif arch == "x86":
        result += "32"
    elif arch == "aarch64":
        result += "arm64"
    elif arch == "arm":
        result += arch
    else:
        raise Exception(f"Architecture not supported: {arch}")

    return result

def get_version_arch() -> str:
    arch = machine().lower()

    if platform == "linux":
        if arch == "x86_64":
            return "amd64"
        raise Exception("Only x64 is available on Linux")
    
    if arch == "aarch64":
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

    raise Exception("The hell?")

def get_project_root() -> str:
    return os.path.join(os.path.dirname(os.path.realpath(__file__)), os.path.pardir)

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

def download_version(url: str) -> str:
    project_root = get_project_root()
    file_path = os.path.join(project_root, "spotify")

    with open(file_path, "wb") as f:
        print("Downloading Spotify release...")
        
        res = requests.get(url)

        if res._content is None:
            raise Exception(f"Download request failed with code {res.status_code}")

        f.write(res._content)

    print(f"Wrote Spotify release to {file_path}")

    return file_path

def read_cef_version(spotify_path: str) -> str:
    project_root = get_project_root()
    temp_folder = os.path.join(project_root, "spotify_temp")

    if os.path.exists(temp_folder):
        shutil.rmtree(temp_folder)
        print("Removed old spotify_temp folder")

    os.mkdir(temp_folder)
    print("Created spotify_temp folder")

    if platform == "win32":
        subprocess.run([spotify_path, "/extract", temp_folder]).check_returncode()
    elif platform == "linux":
        subprocess.run(["ar", "x", "--output", temp_folder, spotify_path]).check_returncode()
        tar = tarfile.open(os.path.join(temp_folder, "data.tar.gz"))
        tar.extractall(temp_folder, filter="data")
    elif platform == "darwin":
        raise Exception("Macos isn't fully implemented yet in the install script, open a PR")

    for root, _, files in os.walk(temp_folder, topdown=False):
        for file_name in files:
            if not "libcef." in file_name:
                continue

            libcef_path = os.path.join(root, file_name)
            print(f"Found libcef at {os.path.realpath(root)}/{file_name}")

            f = open(libcef_path, "rb")
            content = f.read()
            result = LIBCEF_REGEX.findall(content.decode(errors="replace"))[0]
            f.close()
            
            print(f"Found CEF version {result}")
            
            os.remove(spotify_path)
            print("Removed Spotify path")
            shutil.rmtree(root)
            print("Removed spotify_temp folder")

            return result

    raise Exception("Couldn't find libcef version")

def get_cef_build_url(cef_version: str) -> str:
    print("Fetching CEF builds...")

    versions = requests.get(CEF_BUILDS).json()
    os_versions = versions[get_cef_os()]["versions"]

    for version in os_versions:
        version_name = version["cef_version"]
        if version_name != cef_version:
            continue

        for file in version["files"]:
            if file["type"] != "minimal":
                continue

            print(f"Found CEF build {file['name']}")

            return f"{CEF_CDN}/{file['name']}"

    raise Exception(f"Couldn't find CEF build for {get_cef_os()} with version {cef_version}")

def clone_cef_build(build_url: str) -> str:
    project_root = get_project_root()
    temp_file = os.path.join(project_root, "cef_build")

    with open(temp_file, "wb") as f:
        print("Downloading CEF build...")

        res = requests.get(build_url)
        if res._content is None:
            raise Exception(f"CEF build download failed with code {res.status_code}")

        f.write(res._content)
        print(f"Downloaded CEF build to {os.path.realpath(temp_file)}")

    cef_path = os.path.join(project_root, "cef")
    if os.path.exists(cef_path):
        shutil.rmtree(cef_path)
        print("Removed old CEF build")

    print("Extracting CEF build")
    
    tar = tarfile.open(temp_file)
    for member in tar.getmembers():
        if not member.name.startswith("cef_binary_"):
            continue

        parts = member.name.split("/", 1)
        if len(parts) <= 1:
            continue

        member.name = parts[1]
        tar.extract(member, cef_path, filter="data")

    print(f"Extracted all files from CEF build to {os.path.realpath(cef_path)}")

    os.remove(temp_file)
    print("Removed cef_build file")

    return cef_path

if __name__ == "__main__":
    download_url = get_latest_version()
    spotify_path = download_version(download_url)
    cef_version = read_cef_version(spotify_path)
    build_url = get_cef_build_url(cef_version)
    clone_cef_build(build_url)

    print("Success!")

