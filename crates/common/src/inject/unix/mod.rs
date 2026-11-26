mod elf;

use crate::{consts, inject::BackupInjectorBackend};
use anyhow::{Context, Result};
use elf::Elf;
use log::debug;
use std::{fs, path::PathBuf};

pub struct Backend {
	spotify_binary: PathBuf,
}

impl BackupInjectorBackend for Backend {
	fn get_binary(&self) -> &PathBuf { &self.spotify_binary }

	fn patch(&self, input: Vec<u8>, mut output: impl std::io::Write) -> Result<bool> {
		let native = consts::paths::extendify_native().into_string().unwrap();
		let elf = Elf::parse(&input)?;

		if elf.has_needed(&native)? {
			debug!("Extendify injection state already matches, skipping patch");
			return Ok(false);
		}

		let patched = elf.with_needed(&native, true)?;
		output.write(&patched).context("Failed to write Spotify binary")?;

		Ok(true)
	}
}

impl super::InjectorBackend for Backend {
	fn new(mut path: PathBuf) -> Self {
		path.push("spotify");

		Backend {
			spotify_binary: path,
		}
	}

	fn is_injected(&self) -> Result<bool> {
		let native = consts::paths::extendify_native().into_string().unwrap();

		let elf = fs::read(&self.spotify_binary).context("Failed to read Spotify binary")?;
		let elf = Elf::parse(&elf)?;

		elf.has_needed(&native)
	}

	fn inject(&self) -> Result<bool> {
		BackupInjectorBackend::inject(self)
	}

	fn uninject(&self) -> Result<bool> {
		BackupInjectorBackend::uninject(self)
	}
}
