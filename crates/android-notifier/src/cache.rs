use crate::apk;
use crate::constants::CACHE_VARIANT;
use announcer::cache::ChannelCache;
use announcer::channel::Channel;
use announcer::diff::{MapDiff, VecDiff};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Seek};

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct AndroidCacheData {
    pub strings: HashMap<String, String>,
    pub remote_allow_list: Vec<String>,
    pub licenses: Vec<String>,
}

pub struct AndroidChannelCache {
    channel: Channel,
}

impl AndroidChannelCache {
    pub fn new(channel: Channel) -> Self {
        Self { channel: channel }
    }
}

impl ChannelCache<AndroidCacheData> for AndroidChannelCache {
    fn channel(&self) -> Channel {
        self.channel
    }

    fn variant(&self) -> &'static str {
        CACHE_VARIANT
    }
}

impl AndroidCacheData {
    pub fn new<R>(mut main_apk: R, config_apk: R) -> Self
    where
        R: Read + Seek,
    {
        Self {
            strings: apk::read_config_strings(config_apk),
            remote_allow_list: apk::read_allow_list(&mut main_apk),
            licenses: apk::read_licenses(&mut main_apk),
        }
    }

    pub async fn new_from_urls(apk_url: String, config_url: String) -> Self {
        let main_apk = apk::temp_download_apk(apk_url).await;
        let config_apk = apk::temp_download_apk(config_url).await;
        Self::new(main_apk, config_apk)
    }
}

#[derive(Debug)]
pub struct AndroidCacheDiff {
    pub strings: MapDiff,
    pub remote_allow_list: VecDiff,
    pub licenses: VecDiff,
}

impl AndroidCacheDiff {
    pub fn from(old_ref: &AndroidCacheData, new_ref: &AndroidCacheData) -> Self {
        let old = old_ref.clone();
        let new = new_ref.clone();

        Self {
            strings: MapDiff::from(old.strings, new.strings),
            remote_allow_list: VecDiff::from(old.remote_allow_list, new.remote_allow_list),
            licenses: VecDiff::from(old.licenses, new.licenses),
        }
    }
}
