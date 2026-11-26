#[cfg_attr(target_os = "macos", path = "macos/mod.rs")]
#[cfg_attr(target_os = "windows", path = "win.rs")]
#[cfg_attr(target_os = "linux", path = "unix/mod.rs")]
mod backend;

pub use backend::Backend as Injector;

use anyhow::{Context, Result, ensure};
use log::debug;
use sysinfo::{ProcessRefreshKind, RefreshKind, System};
use std::{fs::{self, File}, io::Write, path::PathBuf};

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

/// An `InjectorBackend` helper for (un)injecting that uses a copy of the original
/// binary to simplify returning to an unmodified state
#[cfg_attr(target_os = "windows", expect(unused))]
trait BackupInjectorBackend: InjectorBackend {
	/// Get the path to the binary
	fn get_binary(&self) -> &PathBuf;
	/// Patch an unmodified binary to inject Extendify
	fn patch(&self, input: Vec<u8>, output: impl Write) -> Result<bool>;

	fn get_binary_backup(&self) -> PathBuf {
		self.get_binary().with_added_extension("bk")
	}

	fn inject(&self) -> Result<bool> {
		if self.is_injected()? {
			debug!("Binary already has Extendify injected, skipping injection");
			return Ok(false);
		}

		let mut binary_path = self.get_binary();
		let binary_path_backup = self.get_binary_backup();
		let binary_path_temp = binary_path.with_added_extension("temp");

		if binary_path_backup.exists() { binary_path = &binary_path_backup; }
		debug!("Patching Spotify binary: {}", binary_path.display());

		let temp = || -> Result<File> {
			let metadata = binary_path.metadata()?;
			let file = File::create(&binary_path_temp).context("Failed to create temporary file")?;
			file.set_permissions(metadata.permissions())?;

			let data = fs::read(&binary_path).context("Failed to read Spotify binary")?;
			self.patch(data, &file).context("Failed to patch binary")?;

			Ok(file)
		}();

		match temp {
			Ok(_) => {
				if !binary_path_backup.exists() {
					fs::rename(&binary_path, &binary_path_backup).context("Failed to backup binary")?;
				}
				fs::rename(binary_path_temp, binary_path).context("Failed to rename file")?;

				Ok(true)
			}
			Err(err) => {
				if binary_path_temp.exists() {
					fs::remove_file(binary_path_temp).context("Failed to cleanup after error")?;
				}

				let permissions_error = err.chain().any(|err| {
					err.downcast_ref::<std::io::Error>().is_some_and(|err| {
						err.kind() == std::io::ErrorKind::PermissionDenied
					})
				});

				if permissions_error {
					Err(err.context(
						"Failed to patch Spotify binary due to permission issue.\n\
						Try retrying the injection with the CLI: sudo -E extendify inject"
					))
				} else {
					Err(err.context("Failed to patch Spotify binary"))
				}
			}
		}
	}

	fn uninject(&self) -> Result<bool> {
		if !self.is_injected()? {
			debug!("Binary doesn't have Extendify injected, skipping uninjection");
			return Ok(false);
		}

		let binary_path = self.get_binary();
		let binary_path_backup = self.get_binary_backup();

		ensure!(binary_path_backup.exists(), "Spotify binary backup missing, can't uninject");

		match fs::rename(binary_path_backup, binary_path) {
			Err(err) if err.kind() == std::io::ErrorKind::PermissionDenied => {
				Err(err).context(
					"Failed to restore Spotify backup due to permission issue.\n\
					Try retrying the uninjection with the CLI: sudo -E extendify uninject"
				)
			},
			Err(err) => Err(err).context("Failed to restore Spotify backup"),
			Ok(_) => Ok(true),
		}
	}
}
