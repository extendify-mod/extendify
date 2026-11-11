pub mod paths {
	use std::{env, path::PathBuf};

	pub fn extendify_root() -> PathBuf {
		cfg_select! {
			target_os = "macos" => env::home_dir().unwrap().join("Library/Application Support/Extendify"),
			windows => PathBuf::from(env::var("LOCALAPPDATA")).join("Extendify"),
			unix => {
				let config = env::var("XDG_CONFIG_HOME")
					.map(|str| PathBuf::from(str))
					.unwrap_or(home_dir().unwrap().join(".config"));

				config.join("extendify")
			},
		}
	}

	pub fn extendify_dist() -> PathBuf {
		extendify_root().join("dist")
	}

	#[cfg(unix)]
	pub fn extendify_native() -> PathBuf {
		let dist = extendify_dist();
		cfg_select! {
			target_os = "macos" => dist.join("extendify.dylib"),
			unix => dist.join("libextendify.so"),
		}
	}
}
