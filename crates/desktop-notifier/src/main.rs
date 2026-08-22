use announcer::{AnnouncementBuilder, cache::ChannelCache, channel::Channel, config::SimpleConfig};
use tokio::time;

use crate::constants::CACHE_VARIANT;

mod cache;
mod constants;
mod dmg;
mod xpui;

#[tokio::main]
async fn main() {
    let config = SimpleConfig::read(CACHE_VARIANT);

    let mut interval = time::interval(time::Duration::from_mins(60));

    loop {
        interval.tick().await;

        if let Err(e) = run(&config).await {
            eprintln!("Crash: {e}");
        }
    }
}

async fn run(config: &SimpleConfig) -> Result<(), Box<dyn std::error::Error>> {
    let channel = Channel::Stable;
    let channel_cache = cache::DesktopChannelCache::new(channel);

    let update = dmg::SpotifyDmg::new().await?;
    let version = update.read_version()?;

    if let Some(old_version) = channel_cache.prev_version() {
        if old_version == version {
            return Ok(());
        }

        println!("Found new version {version}");
    }

    let old_data = channel_cache.read();

    let mut xpui = update.read_xpui()?;
    let new_data = cache::DesktopCacheData::new(&mut xpui).await?;

    let diff = cache::DesktopCacheDiff::from(&old_data, &new_data);

    let response = AnnouncementBuilder::new(config.webhook.get_url())
        .add_version_component(
            channel.color(),
            channel.pretty_name(),
            version.clone(),
            "Windows/MacOS",
        )
        .add_map_diff_component("Strings", diff.strings)
        .add_vec_diff_component("Licenses", diff.licenses)
        .send()
        .await;
    println!("Message response: {response:?}");

    channel_cache.write(&new_data);
    channel_cache.write_prev_version(&version);

    Ok(())
}
