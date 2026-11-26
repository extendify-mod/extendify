pub mod paths {
	use dirs::config_local_dir;
	use std::path::PathBuf;

	fn push(mut buf: PathBuf, path: &str) -> PathBuf {
		buf.push(path);
		buf
	}

	pub fn extendify_data() -> PathBuf {
		push(config_local_dir().unwrap(), "extendify")
	}

	/// The directory where the downloaded Extendify components and `version.json` are stored
	pub fn extendify_dist() -> PathBuf {
		push(extendify_data(), "dist")
	}

	/// The file that tracks the built Extendify component versions
	pub fn extendify_versions() -> PathBuf {
		push(extendify_dist(), "versions.json")
	}

	/// The path to the Extendify native library for the current platform
	pub fn extendify_native() -> PathBuf {
		let mut path = extendify_dist();
		path.push("extendify");
		path.add_extension(
			cfg_select! {
				target_os = "macos" => "dylib",
				target_os = "windows" => "dll",
				target_os = "linux" => "so",
			}
		);
		path
	}

	/// The likely path for Spotify to be at on the current OS
	pub fn spotify_path() -> Option<PathBuf> {
		cfg_select! {
			target_os = "macos" => Some(PathBuf::from("/Applications/Spotify.app")),
			target_os = "windows" => Some(push(dirs::data_dir().unwrap(), "Spotify")),
			target_os = "linux" => ["/usr/share/spotify", "/opt/spotify"]
				.into_iter().map(PathBuf::from).find(|path| path.is_dir()),
		}
	}

	/// The path to the injected DLL on Windows
	#[cfg(target_os = "windows")]
	pub fn spotify_extendify_native(spotify_path: &PathBuf) -> PathBuf {
		spotify_path.join("DWrite.dll")
	}
}

pub mod github {
	pub const API_RELEASES: &str = "https://ungh.cc/repos/extendify-mod/extendify/releases";
	pub const WEB_TAG: &str = "artifacts";
	pub const NATIVE_TAG: &str = "native";

	/// Get the download URL for a specific Extendify web file
	pub fn web_file_url(file: &str) -> String {
		format!("https://github.com/extendify-mod/extendify/releases/download/{WEB_TAG}/{file}")
	}
	/// Get the download URL for the platform's native library
	pub fn native_url() -> String {
		let native = native_lib();
		format!("https://github.com/extendify-mod/extendify/releases/download/{NATIVE_TAG}/{native}")
	}

	/// Get the file name of the Extendify native library for this platform
	fn native_lib() -> &'static str {
		cfg_select! {
			target_os = "macos" => "macos_arm64.dylib",
			unix => "linux_x86_64.so",
			all(windows, target_arch = "aarch64") => "windows_aarch64.dll",
			all(windows, target_arch = "x86_64") => "windows_x86_64.dll",
		}
	}
}
