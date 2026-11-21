#[cfg_attr(target_os = "macos", path = "macos/mod.rs")]
#[cfg_attr(target_os = "windows", path = "win.rs")]
mod backend;

pub use backend::Backend as Injector;

use anyhow::Result;
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
}
