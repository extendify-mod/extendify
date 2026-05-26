use crate::config::Config;
use crate::google_play_client::GooglePlayClient;
use announcer::AnnouncementBuilder;
use announcer::cache::ChannelCache;
use announcer::channel::Channel;
use tokio::time;

mod apk;
mod cache;
mod config;
mod constants;
mod google_play_client;

#[tokio::main]
async fn main() {
    let config = Config::read();

    let mut interval = time::interval(time::Duration::from_mins(1));

    loop {
        interval.tick().await;

        if let Err(e) = run(&config).await {
            eprintln!("Crash: {e}");
        }
    }
}

async fn run(config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    for channel in enum_iterator::all::<Channel>() {
        let channel_config = config.get_channel_config(&channel);

        let mut client =
            GooglePlayClient::new(channel, channel_config.email, channel_config.aas_token);
        client.initialize().await?;

        let channel_cache = cache::AndroidChannelCache::new(channel);
        let old_data = channel_cache.read();

        let details = client.get_latest_version().await?;
        if let Some(old_version) = channel_cache.prev_version() {
            if old_version == details.version_string {
                continue;
            }

            println!("Found new {channel} version {}", details.version_string);
        }

        let dl_info = client.get_download_info(details.version_code).await?;

        if let Some(config_apk) = dl_info.splits.iter().find(|v| v.name == "config.en") {
            let new_data = cache::AndroidCacheData::new_from_urls(
                dl_info.main_apk_url,
                config_apk.url.clone(),
            )
            .await;

            let diff = cache::AndroidCacheDiff::from(&old_data, &new_data);

            let response = AnnouncementBuilder::new(config.webhook.get_url())
                .add_version_component(
                    channel.color(),
                    channel.pretty_name(),
                    format!(
                        "{}{} ({})",
                        details.version_string,
                        channel.id(),
                        details.version_code
                    ),
                    "Android",
                )
                .add_map_diff_component("Strings", diff.strings)
                .add_vec_diff_component("Licenses", diff.licenses)
                .add_vec_diff_component("Remote Allowlist", diff.remote_allow_list)
                .send()
                .await;
            println!("Message response: {response:?}");

            channel_cache.write(&new_data);
            channel_cache.write_prev_version(&details.version_string);

            println!("Sent announcement for {channel} {}", details.version_string);
        } else {
            println!(
                "Couldn't find config.en for {channel} {}",
                details.version_code
            );
        }
    }

    Ok(())
}
