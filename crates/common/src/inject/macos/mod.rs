mod macho;

use crate::{consts, inject::BackupInjectorBackend};
use anyhow::{Context, Result};
use macho::MachO;
use std::{fs, path::PathBuf};

pub struct Backend {
	spotify_binary: PathBuf,
}

impl BackupInjectorBackend for Backend {
	fn get_binary(&self) -> &PathBuf { &self.spotify_binary }

	fn patch(&self, input: Vec<u8>, mut output: impl std::io::Write) -> Result<bool> {
		let native = consts::paths::extendify_native().into_string().unwrap();

		let mut macho = MachO::parse(input);
		macho.add_dylib_load_path(&native).context("Failed to add dylib load command")?;
		macho.sign()?;

		output.write(&macho.data())?;

		Ok(true)
	}
}

impl super::InjectorBackend for Backend {
	fn new(path: PathBuf) -> Self {
		let spotify_binary = path.join("Contents/MacOS/Spotify");

		Backend { spotify_binary }
	}

	fn is_injected(&self) -> Result<bool> {
		let dylib_path = consts::paths::extendify_native().into_string().unwrap();

		let macho = fs::read(&self.spotify_binary).context("Failed to read Spotify binary")?;
		let macho = MachO::parse(macho);

		Ok(macho.has_dylib(&dylib_path))
	}

	fn inject(&self) -> Result<bool> {
		BackupInjectorBackend::inject(self)
	}

	fn uninject(&self) -> Result<bool> {
		BackupInjectorBackend::uninject(self)
	}
}
