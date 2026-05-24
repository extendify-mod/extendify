use crate::apk;
use crate::channel::Channel;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::io::{BufReader, Read, Seek};
use std::{fs, fs::OpenOptions};

const CACHE_VARIANT: &str = "android";
const CACHE_FILENAME: &str = "cache.json";

#[derive(Serialize, Deserialize, Default)]
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

        let file = OpenOptions::new()
            .create(true)
            .write(true)
            .read(true)
            .open(cache_path)
            .expect("Couldn't open cache file");
        let reader = BufReader::new(file);

        let mut cache: Self = serde_json::from_reader(reader).unwrap_or_default();
        cache.channel = channel;
        cache
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

    pub fn compare(self, old: Self) -> CacheDiff {
        CacheDiff::from(old, self)
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

#[derive(Debug)]
pub struct VecDiff {
    pub added: Vec<String>,
    pub removed: Vec<String>,
}

impl VecDiff {
    pub fn from(old: Vec<String>, new: Vec<String>) -> VecDiff {
        let mut added: Vec<String> = vec![];
        let mut removed: Vec<String> = vec![];

        let all_items: HashSet<_> = old.iter().chain(new.iter()).collect();

        for item in all_items {
            let old_item = old.iter().find(|v| *v == item);
            let new_item = new.iter().find(|v| *v == item);

            if old_item.is_none() && new_item.is_some() {
                added.push(item.to_string());
            } else if old_item.is_some() && new_item.is_none() {
                removed.push(item.to_string());
            }
        }

        VecDiff {
            added: added,
            removed: removed,
        }
    }

    pub fn changed(&self) -> bool {
        !self.added.is_empty() || !self.removed.is_empty()
    }
}

#[derive(Debug)]
pub struct MapDiff {
    pub added: HashMap<String, String>,
    pub removed: HashMap<String, String>,
    pub changed: HashMap<String, MapEntryChange>,
}

impl MapDiff {
    pub fn from(old: HashMap<String, String>, new: HashMap<String, String>) -> Self {
        let mut added = HashMap::<String, String>::new();
        let mut removed = HashMap::<String, String>::new();
        let mut changed = HashMap::<String, MapEntryChange>::new();

        let keys: HashSet<_> = old.keys().chain(new.keys()).collect();

        for key in keys {
            let key = key.clone();
            let old_value = old.get(&key);
            let new_value = new.get(&key);

            if new_value.is_some() && old_value.is_none() {
                added.insert(key, new_value.unwrap().to_string());
            } else if old_value.is_some() && new_value.is_none() {
                removed.insert(key, old_value.unwrap().to_string());
            } else if old_value.is_some()
                && new_value.is_some()
                && (old_value.unwrap() != new_value.unwrap())
            {
                changed.insert(
                    key,
                    MapEntryChange {
                        old: old_value.unwrap().to_string(),
                        new: new_value.unwrap().to_string(),
                    },
                );
            }
        }

        Self {
            added: added,
            removed: removed,
            changed: changed,
        }
    }

    pub fn changed(&self) -> bool {
        !self.added.is_empty() || !self.removed.is_empty() || !self.changed.is_empty()
    }
}

#[derive(Debug)]
pub struct MapEntryChange {
    old: String,
    new: String,
}
