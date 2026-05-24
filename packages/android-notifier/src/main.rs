use crate::channel::Channel;
use crate::config::Config;
use crate::google_play_client::GooglePlayClient;
use announcer::AnnouncementBuilder;
use serde_json::json;
use std::fs::File;

mod apk;
mod cache;
mod channel;
mod config;
mod google_play_client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // let config = Config::read();
    //
    let channel = Channel::Stable;
    // let channel_config = config.get_channel_config(&channel);
    //
    // let mut client = GooglePlayClient::new(channel, channel_config.email, channel_config.aas_token);
    // client.initialize().await?;
    //
    // let details = client.get_latest_version().await?;
    // println!("{details:#?}");
    //
    // let dl_info = client.get_download_info(details.version_code).await?;
    // println!("{dl_info:#?}");
    //
    // let response = AnnouncementBuilder::default()
    //     .webhook_url(config.webhook.get_url())
    //     .json(json!({
    //         "flags": 1 << 15,
    //         "components": [
    //             {
    //                 "type": 17,
    //                 "accent_color": channel.color(),
    //                 "components": [
    //                     {
    //                         "type": 10,
    //                         "content": format!("## New {} Version", channel.pretty_name()),
    //                     },
    //                     { "type": 14 },
    //                     {
    //                         "type": 10,
    //                         "content": format!("**{}{} ({})** released for **Android**", details.version_string, channel.id(), details.version_code),
    //                     },
    //                 ],
    //             },
    //         ],
    //     }))
    //     .build()
    //     .expect("Invalid embed")
    //     .send()
    //     .await?;
    // println!("{}", response);

    let old = cache::ChannelCache::read(Channel::Stable);
    let new = cache::ChannelCache::read(Channel::Beta);

    let comparison = new.compare(old);
    println!("{comparison:#?}");

    Ok(())
}
