mod macho;

use crate::consts;
use anyhow::{Context, Result, bail};
use log::debug;
use macho::MachO;
use std::{
	fs::{self, File}, io::Write, path::PathBuf
};

pub struct Backend {
	spotify_binary: PathBuf,
	spotify_binary_backup: PathBuf,
}

impl super::InjectorBackend for Backend {
	fn new(path: PathBuf) -> Self {
		let spotify_binary = path.join("Contents/MacOS/Spotify");
		let spotify_binary_backup = spotify_binary.with_added_extension("bk");

		Backend { spotify_binary, spotify_binary_backup }
	}

	fn is_injected(&self) -> Result<bool> {
		let dylib_path = consts::paths::extendify_native().into_string().unwrap();

		let macho = fs::read(&self.spotify_binary).context("Failed to read Spotify binary")?;
		let macho = MachO::parse(macho);

		Ok(macho.has_dylib(&dylib_path))
	}

	fn inject(&self) -> Result<bool> {
		if self.is_injected()? {
			debug!("Binary already has Extendify injected, skipping injection");
			return Ok(false);
		}

		let mut macho_path = &self.spotify_binary;
		let macho_path_backup = &self.spotify_binary_backup;
		let macho_path_temp = macho_path.with_added_extension("temp");
		let dylib_path = consts::paths::extendify_native().into_string().unwrap();

		debug!("Patching Spotify binary: {}", macho_path.display());

		if macho_path_backup.exists() { macho_path = &macho_path_backup; }

		let macho = fs::read(&macho_path).context("Failed to read Spotify binary")?;
		let mut macho = MachO::parse(macho);
		macho.add_dylib_load_path(&dylib_path).context("Failed to add dylib load command")?;
		macho.sign()?;

		let write_res = || -> Result<()> {
			let mut file = File::create(&macho_path_temp)?;
			file.set_permissions(macho_path.metadata()?.permissions())?;
			file.write(&macho.data())?;
			Ok(())
		}();

		match write_res {
			Ok(_) => {
				if !macho_path_backup.exists() {
					fs::rename(&macho_path, &macho_path_backup).context("Failed to backup binary")?;
				}
				fs::rename(macho_path_temp, macho_path).context("Failed to rename file")?;

				Ok(true)
			}
			Err(e) => {
				fs::remove_file(macho_path_temp).context("Failed to cleanup after error")?;
				Err(e.context("Failed to patch Spotify binary"))
			}
		}
	}

	fn uninject(&self) -> Result<bool> {
		if !self.is_injected()? {
			debug!("Binary doesn't have Extendify injected, skipping uninjection");
			return Ok(false);
		}

		let macho_path = &self.spotify_binary;
		let macho_path_backup = &self.spotify_binary_backup;

		if !macho_path_backup.exists() {
			bail!("Spotify binary backup missing, can't uninject");
		}

		fs::rename(macho_path_backup, macho_path)?;

		Ok(true)
	}
}
