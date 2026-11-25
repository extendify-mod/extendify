#[cfg_attr(target_os = "macos", path = "macos/mod.rs")]
#[cfg_attr(target_os = "windows", path = "win.rs")]
mod backend;

pub use backend::Backend as Injector;

use anyhow::{Result, ensure};
use sysinfo::{ProcessRefreshKind, RefreshKind, System};
use std::path::PathBuf;

/// Struct for managing Extendify injection for a Spotify install
pub trait InjectorBackend {
	/// Create a new injector pointing to a given Spotify app path
	fn new(path: PathBuf) -> Self;

	/// Whether Extendify is injected into a Spotify install.
	fn is_injected(&self) -> Result<bool>;
	/// Inject Extendify into a Spotify install.
	///
	/// Returns a boolean indicating whether any changes were made (if already injected, returns `false`).
	fn inject(&self) -> Result<bool>;
	/// Uninject Extendify from a Spotify install.
	///
	/// Returns a boolean indicating whether any changes were made (if already uninjected, returns `false`).
	fn uninject(&self) -> Result<bool>;

	/// Kill the Spotify process.
	/// 
	/// Returns a boolean indicating whether any process was killed.
	fn kill() -> Result<bool> {
		let sys = System::new_with_specifics(
			RefreshKind::nothing().with_processes(ProcessRefreshKind::nothing()),
		)?;

		let name = cfg_select! {
			target_os = "windows" => "Spotify.exe",
			target_os = "macos" => "Spotify",
			target_os = "linux" => "spotify",
		};

		let mut killed = false;
		let proc = sys.processes_by_exact_name(name.as_ref());
		for process in proc {
			let parent_pid = process.parent().unwrap();
			let parent = sys.process(parent_pid).unwrap();

			// Only kill the root Spotify process
			if parent.name() != name {
				ensure!(process.kill(), "Failed to send Spotify kill signal");
				killed = true;
			}
		}

		Ok(killed)
	}
}
