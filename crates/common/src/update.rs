use std::fs;

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use log::debug;
use nestify::nest;
use serde::{Deserialize, Serialize};

use crate::consts;

/// A timestamp, representing the time a given file was published
type Time = DateTime<Utc>;

struct RemoteVersions {
	/// Tuple with the timestamp of the assets and a Vec of all file names
	web: (Time, Vec<String>),
	native: Time,
}

/// The timestamps of the locally downloaded Extendify components
#[derive(Serialize, Deserialize)]
struct LocalVersions {
	web: Time,
	native: Time,
}

nest! {
	#[derive(Deserialize)]*
	struct Releases {
		releases: Vec<struct Release {
			tag: String,
			assets: Vec<struct Asset {
				#[serde(rename = "updatedAt")]
				updated_at: Time,
				#[serde(rename = "downloadUrl")]
				download_url: String,
			}>,
		}>,		
	}
}

fn get_remote_versions() -> Result<RemoteVersions> {
	let releases: Releases = reqwest::blocking::get(consts::github::API_RELEASES)?.json()?;

	let web = releases.releases.iter()
		.find(|x| x.tag == consts::github::WEB_TAG)
		.context("Failed to find web tag")?;
	let native = releases.releases.iter()
		.find(|x| x.tag == consts::github::NATIVE_TAG)
		.context("Failed to find native tag")?;

	let web_time = web.assets.iter().map(|x| x.updated_at).max().unwrap();
	let web_assets: Vec<String> = web.assets.iter().map(|x| {
		x.download_url.split("/").last().unwrap().into()
	}).collect();
	let web = (web_time, web_assets);

	let native = native.assets.iter()
		.find(|x| x.download_url == consts::github::native_url())
		.context("Failed to find native library for platform")?
		.updated_at;

	Ok(RemoteVersions { web, native })
}

fn get_local_versions() -> Result<Option<LocalVersions>> {
	let path = consts::paths::extendify_versions();
	if !path.exists() { return Ok(None); }

	let data = fs::read_to_string(path)?;
	let data: LocalVersions = serde_json::from_str(&data)?;

	Ok(Some(data))
}

struct Updates {
	web: Option<(Time, Vec<String>)>,
	native: Option<Time>,
	versions: LocalVersions,
}

fn get_updates() -> Result<Updates> {
	let remote = get_remote_versions()?;
	let downloaded = get_local_versions()?;

	let versions = LocalVersions {
		web: remote.web.0,
		native: remote.native
	};

	if let Some(downloaded) = downloaded {
		let web = if remote.web.0 > downloaded.web { Some(remote.web) } else { None };
		let native = if remote.native > downloaded.native { Some(remote.native) } else { None };

		Ok(Updates { web, native, versions })
	} else {
		Ok(Updates {
			web: Some(remote.web),
			native: Some(remote.native),
			versions,
		})
	}
}

/// Whether Extendify is downloaded locally
pub fn downloaded() -> Result<bool> {
	let updates = get_local_versions()?;
	Ok(updates.is_some())
}
pub fn has_updates() -> Result<bool> {
	let updates = get_updates()?;
	Ok(updates.native.is_some() || updates.web.is_some())
}

/// Updates all Extendify components. Returns a boolean that indicates whether anything was actually updated.
pub fn update() -> Result<bool> {
	let updates = get_updates()?;

	let has_update = updates.web.is_some() || updates.native.is_some();
	if !has_update { return Ok(false); }

	let dist = consts::paths::extendify_dist();
	if !dist.exists() {
		fs::create_dir_all(&dist)
			.with_context(|| format!("Failed to create Extendify directory: {}", &dist.display()))?;
	}

	if let Some((_, files)) = &updates.web {
		debug!("Updating web components");

		for file in files {
			let path = dist.join(file);
			let url = consts::github::web_file_url(file);
			let data = reqwest::blocking::get(url)
				.with_context(|| format!("Failed to download {file}"))?
				.bytes()?;
			fs::write(path, data)?;
		}
	}
	if updates.native.is_some() {
		debug!("Updating native component");

		let path = consts::paths::extendify_native();
		let url = consts::github::native_url();
		let data = reqwest::blocking::get(&url)
			.with_context(|| format!("Failed to download native component: {url}"))?
			.bytes()?;
		fs::write(path, data)?;
	}

	let path = consts::paths::extendify_versions();
	let versions = serde_json::to_string_pretty(&updates.versions)?;
	fs::write(path, versions)?;

	Ok(true)
}
