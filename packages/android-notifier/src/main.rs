use crate::config::Config;
use crate::google_play_client::GooglePlayClient;
use announcer::Announcement;
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

        let old = cache::ChannelCache::read(channel);
        let details = client.get_latest_version().await?;
        if let Some(old_version) = old.prev_version() {
            if old_version == details.version_code {
                continue;
            }

            println!("Found new {channel} version {}", details.version_string);
        }

        let dl_info = client.get_download_info(details.version_code).await?;

        if let Some(config_apk) = dl_info.splits.iter().find(|v| v.name == "config.en") {
            let new = cache::ChannelCache::new_from_urls(
                channel,
                dl_info.main_apk_url,
                config_apk.url.clone(),
            )
            .await;

            let comparison = new.compare(old);

            let mut announcement = Announcement::new(config.webhook.get_url());
            announcement.add_version_component(
                channel.color(),
                channel.pretty_name(),
                format!(
                    "{}{} ({})",
                    details.version_string,
                    channel.id(),
                    details.version_code
                ),
                "Android",
            );
            announcement.add_map_diff_component("Strings", comparison.strings);
            announcement.add_vec_diff_component("Licenses", comparison.licenses);
            announcement.add_vec_diff_component("Remote Allowlist", comparison.remote_allow_list);
            _ = announcement.send().await;

            new.write();
            new.set_prev_version(details.version_code);

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
