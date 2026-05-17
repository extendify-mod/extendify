import os
from lib import *

if __name__ == "__main__":
    project_root = get_project_root()

    download_url = get_latest_version()
    spotify_path = download_version(download_url, project_root)
    cef_version = read_cef_version(spotify_path, project_root)
    build_url = get_cef_build_url(cef_version)
    clone_cef_build(build_url, project_root)

    print("Success!")
