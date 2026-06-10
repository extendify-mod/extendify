use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::OpenOptions;
use std::io;
use std::io::{BufReader, Write};
use std::path::PathBuf;

use crate::channel::Channel;

const CACHE_FILENAME: &str = "cache.json";
const VERSION_FILENAME: &str = "last_version.txt";

fn ensure_dirs(path: &PathBuf) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("Couldn't create parent dirs");
    }
}

pub trait ChannelCache<T>
where
    T: for<'de> Deserialize<'de> + Serialize + Default,
{
    fn channel(&self) -> Channel;

    fn variant(&self) -> &'static str;

    fn cache_path(&self, filename: &str) -> PathBuf {
        let channel = self.channel();
        let variant = self.variant();

        channel.get_data_path(&variant).join(filename)
    }

    fn read(&self) -> T {
        let cache_path = self.cache_path(CACHE_FILENAME);

        if let Ok(file) = OpenOptions::new()
            .create(true)
            .write(true)
            .read(true)
            .open(cache_path)
        {
            let reader = BufReader::new(file);
            serde_json::from_reader(reader).unwrap_or_default()
        } else {
            Default::default()
        }
    }

    fn write(&self, data: &T) {
        let cache_path = self.cache_path(CACHE_FILENAME);
        ensure_dirs(&cache_path);

        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(cache_path)
            .expect("Couldn't open cache file");

        let result = if cfg!(debug_assertions) {
            serde_json::to_writer_pretty(file, &data)
        } else {
            serde_json::to_writer(file, &data)
        };
        result.expect("Couldn't write cache");
    }

    fn prev_version(&self) -> Option<String> {
        let cache_path = self.cache_path(VERSION_FILENAME);

        if let Ok(file) = OpenOptions::new().read(true).open(cache_path) {
            Some(io::read_to_string(file).expect("Couldn't read version file"))
        } else {
            None
        }
    }

    fn write_prev_version(&self, version: &String) {
        let cache_path = self.cache_path(VERSION_FILENAME);
        ensure_dirs(&cache_path);

        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(cache_path)
            .expect("Couldn't open cache file");

        file.write_all(version.as_bytes())
            .expect("Couldn't write to version file");
    }
}
