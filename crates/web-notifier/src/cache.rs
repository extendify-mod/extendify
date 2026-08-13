use announcer::{cache::ChannelCache, channel::Channel};
use serde::{Deserialize, Serialize};

use crate::constants::CACHE_VARIANT;

#[derive(Serialize, Deserialize, Default)]
pub(crate) struct WebCacheData {}

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
