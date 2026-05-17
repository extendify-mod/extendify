import os
from lib import *

if __name__ == "__main__":
    project_root = get_project_root()

    download_url = get_latest_version()
    spotify_path = download_version(download_url, project_root)
    cef_version = read_cef_version(spotify_path, project_root)
    build_info = get_cef_build_info(cef_version)

    parts = build_info["cef_version"].split("+")
    print(f"""
{{
  version = "{parts[0]}";
  gitRevision = "{parts[1][1:]}";
  chromiumVersion = "{parts[2][len("chromium-"):]}";
  # srcHashes.${{system}} = "fail build once and copy";
}}
          """)

