import re, os, shutil, subprocess, tarfile, requests
from sys import platform
from platform import machine

CEF_CDN = "https://cef-builds.spotifycdn.com"
CEF_BUILDS = f"{CEF_CDN}/index.json"
LIBCEF_REGEX = re.compile(r"\d+\.\d+\.\d+\+g[a-f0-9]+\+chromium-\d+\.\d+\.\d+\.\d+")

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
    elif arch in ["aarch64", "arm64"]:
        result += "arm64"
    elif arch == "arm":
        result += arch
    else:
        raise Exception(f"Architecture not supported: {arch}")

    return result

def read_cef_version(spotify_path: str, project_root: str) -> str:
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
        subprocess.run(["tar", "-xjf", spotify_path, "-C", temp_folder]).check_returncode()

    for root, _, files in os.walk(temp_folder, topdown=False):
        for file_name in files:
            if "libcef." not in file_name and file_name != "Chromium Embedded Framework":
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

def get_cef_build_info(cef_version: str) -> dict:
    print("Fetching CEF builds...")

    versions = requests.get(CEF_BUILDS).json()
    os_versions = versions[get_cef_os()]["versions"]

    for version in os_versions:
        version_name = version["cef_version"]
        if version_name != cef_version:
            continue

        return version

    raise Exception(f"Couldn't find CEF version info for {get_cef_os()} with version {cef_version}")

def get_cef_build_url(cef_version: str) -> str:
    build_info = get_cef_build_info(cef_version)

    for file in version["files"]:
        if file["type"] != "minimal":
            continue

        print(f"Found CEF build {file['name']}")

        return f"{CEF_CDN}/{file['name']}"

    raise Exception(f"Couldn't find CEF build for {get_cef_os()} with version {cef_version}")

def clone_cef_build(build_url: str, project_root: str) -> str:
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

    tar.close()
    os.remove(temp_file)
    print("Removed cef_build file")

    return cef_path
