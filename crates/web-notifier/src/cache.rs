use std::collections::HashMap;

use announcer::{cache::ChannelCache, channel::Channel, diff::MapDiff};
use serde::{Deserialize, Serialize};

use crate::constants::CACHE_VARIANT;

#[derive(Clone, Serialize, Deserialize, Default)]
pub(crate) struct WebCacheData {
    pub strings: HashMap<String, String>,
}

pub(crate) struct WebChannelCache {
    #[allow(unused)]
    channel: Channel,
}

impl WebChannelCache {
    pub fn new(channel: Channel) -> Self {
        Self { channel: channel }
    }
}

impl ChannelCache<WebCacheData> for WebChannelCache {
    fn channel(&self) -> Channel {
        Channel::Stable
    }

    fn variant(&self) -> &'static str {
        CACHE_VARIANT
    }
}

pub(crate) struct WebCacheDiff {
    pub strings: MapDiff,
}

impl WebCacheDiff {
    pub fn from(old_ref: &WebCacheData, new_ref: &WebCacheData) -> Self {
        let old = old_ref.clone();
        let new = new_ref.clone();

        Self {
            strings: MapDiff::from(old.strings, new.strings),
        }
    }
}
