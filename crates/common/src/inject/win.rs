use crate::consts;
use anyhow::{Context, Result};
use log::debug;
use std::{fs, path::PathBuf};

pub struct Backend {
	spotify_extendify_native: PathBuf,
}

/// NOTE: This injector doesn't work across filesystem boundaries
impl super::InjectorBackend for Backend {
	fn new(path: PathBuf) -> Self {
		Backend {
			spotify_extendify_native: consts::paths::spotify_extendify_native(&path),
		}
	}

	fn is_injected(&self) -> Result<bool> {
		Ok(self.spotify_extendify_native.exists())
	}

	fn inject(&self) -> Result<bool> {
		if self.is_injected()? {
			debug!("Extendify already injected, skipping injection");
			return Ok(false);
		}

		let extendify_dll = &consts::paths::extendify_native();
		let spotify_dll = &self.spotify_extendify_native;

		fs::hard_link(extendify_dll, spotify_dll)
			.with_context(||
				format!(
					"Failed to make hardlink from {} to {} (are they on different disks?)",
					extendify_dll.display(),
					spotify_dll.display(),
				)
			)?;

		Ok(true)
	}

	fn uninject(&self) -> Result<bool> {
		if !self.is_injected()? {
			debug!("Extendify already uninjected, skipping uninjection");
			return Ok(false);
		}

		fs::remove_file(&self.spotify_extendify_native)?;

		Ok(true)
	}
}
