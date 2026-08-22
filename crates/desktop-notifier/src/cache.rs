use std::collections::HashMap;

use announcer::{
    cache::ChannelCache,
    channel::Channel,
    diff::{MapDiff, VecDiff},
    util,
};
use serde::{Deserialize, Serialize};
use std::io::{Read, Seek};
use zip::ZipArchive;

use crate::constants::CACHE_VARIANT;
use crate::xpui;

#[derive(Clone, Serialize, Deserialize, Default)]
pub(crate) struct DesktopCacheData {
    pub strings: HashMap<String, String>,
    pub licenses: Vec<String>,
}

impl DesktopCacheData {
    pub async fn new<R>(xpui: &mut ZipArchive<R>) -> Result<Self, Box<dyn std::error::Error>>
    where
        R: Read + Seek,
    {
        let mut translations = String::new();
        xpui.by_path("i18n/en.json")?
            .read_to_string(&mut translations)?;
        let strings = util::flatten_json_map(&translations)?;

        let mut licenses_content = String::new();
        xpui.by_path("ui-licenses.html")?
            .read_to_string(&mut licenses_content)?;
        let licenses = xpui::extract_licenses(&licenses_content)?;

        Ok(Self {
            strings: strings,
            licenses: licenses,
        })
    }
}

pub(crate) struct DesktopChannelCache {
    channel: Channel,
}

impl DesktopChannelCache {
    pub fn new(channel: Channel) -> Self {
        Self { channel: channel }
    }
}

impl ChannelCache<DesktopCacheData> for DesktopChannelCache {
    fn channel(&self) -> Channel {
        self.channel
    }

    fn variant(&self) -> &'static str {
        CACHE_VARIANT
    }
}

#[derive(Debug)]
pub(crate) struct DesktopCacheDiff {
    pub strings: MapDiff,
    pub licenses: VecDiff,
}

impl DesktopCacheDiff {
    pub fn from(old_ref: &DesktopCacheData, new_ref: &DesktopCacheData) -> Self {
        let old = old_ref.clone();
        let new = new_ref.clone();

        Self {
            strings: MapDiff::from(old.strings, new.strings),
            licenses: VecDiff::from(old.licenses, new.licenses),
        }
    }
}
