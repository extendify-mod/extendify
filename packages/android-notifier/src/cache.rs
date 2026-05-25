use crate::apk;
use crate::constants::{CACHE_FILENAME, CACHE_VARIANT, CACHE_VERSION_FILENAME};
use announcer::channel::Channel;
use announcer::diff::{MapDiff, VecDiff};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufReader, Read, Seek, Write};
use std::{fs, fs::OpenOptions};

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct ChannelCache {
    pub strings: HashMap<String, String>,
    pub remote_allow_list: Vec<String>,
    pub licenses: Vec<String>,
    #[serde(skip)]
    channel: Channel,
}

impl ChannelCache {
    pub fn read(channel: Channel) -> Self {
        let mut cache_path = channel.get_data_path(CACHE_VARIANT);
        cache_path.push(CACHE_FILENAME);

        if let Ok(file) = OpenOptions::new()
            .create(true)
            .write(true)
            .read(true)
            .open(cache_path)
        {
            let reader = BufReader::new(file);

            let mut cache: Self = serde_json::from_reader(reader).unwrap_or_default();
            cache.channel = channel;
            cache
        } else {
            let mut result: Self = Default::default();
            result.channel = channel;
            result
        }
    }

    pub async fn new_from_urls(channel: Channel, apk_url: String, config_url: String) -> Self {
        let main_apk = apk::temp_download_apk(apk_url).await;
        let config_apk = apk::temp_download_apk(config_url).await;
        Self::new(channel, main_apk, config_apk)
    }

    pub fn new<R>(channel: Channel, mut main_apk: R, config_apk: R) -> Self
    where
        R: Read + Seek,
    {
        Self {
            channel: channel,
            strings: apk::read_config_strings(config_apk),
            remote_allow_list: apk::read_allow_list(&mut main_apk),
            licenses: apk::read_licenses(&mut main_apk),
        }
    }

    pub fn write(&self) {
        let mut cache_path = self.channel.get_data_path(CACHE_VARIANT);
        cache_path.push(CACHE_FILENAME);

        if let Some(parent) = cache_path.parent() {
            fs::create_dir_all(parent).expect("Couldn't create dirs");
        }
        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(cache_path)
            .expect("Couldn't open cache file");

        let result = if cfg!(debug_assertions) {
            serde_json::to_writer_pretty(file, self)
        } else {
            serde_json::to_writer(file, self)
        };
        result.expect("Couldn't write cache");
    }

    pub fn compare(&self, old: Self) -> CacheDiff {
        CacheDiff::from(old, self.clone())
    }

    pub fn prev_version(&self) -> Option<i64> {
        let mut cache_path = self.channel.get_data_path(CACHE_VARIANT);
        cache_path.push(CACHE_VERSION_FILENAME);

        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .write(true)
            .read(true)
            .open(cache_path)
        {
            let mut buf = [0u8; 8];

            if file.read_exact(&mut buf).is_ok() {
                return Some(i64::from_le_bytes(buf));
            }
        }

        None
    }

    pub fn set_prev_version(&self, version_code: i64) {
        let mut cache_path = self.channel.get_data_path(CACHE_VARIANT);
        cache_path.push(CACHE_VERSION_FILENAME);

        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(cache_path)
            .expect("Couldn't open version file");
        _ = file.write_all(&version_code.to_le_bytes());
    }
}

#[derive(Debug)]
pub struct CacheDiff {
    pub strings: MapDiff,
    pub remote_allow_list: VecDiff,
    pub licenses: VecDiff,
}

impl CacheDiff {
    pub fn from(old: ChannelCache, new: ChannelCache) -> Self {
        Self {
            strings: MapDiff::from(old.strings, new.strings),
            remote_allow_list: VecDiff::from(old.remote_allow_list, new.remote_allow_list),
            licenses: VecDiff::from(old.licenses, new.licenses),
        }
    }

    pub fn changed(&self) -> bool {
        self.strings.changed() || self.remote_allow_list.changed() || self.licenses.changed()
    }
}
