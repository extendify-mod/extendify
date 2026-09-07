use dpp::DmgPipeline;
use regex::bytes::Regex;
use std::io::{Cursor, Write};
use tempfile::NamedTempFile;
use zip::ZipArchive;

use crate::constants::DOWNLOAD_URL;

pub struct SpotifyDmg {
    file: NamedTempFile,
}

impl SpotifyDmg {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let dmg = reqwest::get(DOWNLOAD_URL).await?.bytes().await.unwrap();
        let mut file = NamedTempFile::new().unwrap();
        file.write_all(&dmg)?;

        Ok(Self { file: file })
    }

    pub fn read_version(&self) -> Result<String, Box<dyn std::error::Error>> {
        let mut pipeline = DmgPipeline::open(self.file.path())?;
        let mut fs = pipeline.open_filesystem()?;

        let bytes = fs.read_file("/Spotify.app/Contents/MacOS/Spotify")?;

        let version_re = Regex::new(r"\d+\.\d+\.\d+\.\d+\.g[0-9a-f]{6,}")?;
        if let Some(m) = version_re.find(&bytes) {
            let version = String::from_utf8_lossy(m.as_bytes());
            Ok(version.to_string())
        } else {
            Err("Couldn't read version from executable".into())
        }
    }

    pub fn read_xpui(&self) -> Result<ZipArchive<Cursor<Vec<u8>>>, Box<dyn std::error::Error>> {
        let mut pipeline = DmgPipeline::open(self.file.path())?;
        let mut fs = pipeline.open_filesystem()?;

        let bytes = fs.read_file("/Spotify.app/Contents/Resources/Apps/xpui.spa")?;

        let archive = ZipArchive::new(Cursor::new(bytes))?;
        Ok(archive)
    }
}
