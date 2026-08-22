use crate::constants::{CACHE_VARIANT, URL};
use announcer::AnnouncementBuilder;
use announcer::cache::ChannelCache;
use announcer::channel::Channel;
use announcer::config::SimpleConfig;
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use tokio::time;

mod cache;
mod constants;
mod web;

#[tokio::main]
async fn main() {
    let config = SimpleConfig::read(CACHE_VARIANT);

    let mut interval = time::interval(time::Duration::from_mins(10));

    loop {
        interval.tick().await;

        if let Err(e) = run(&config).await {
            eprintln!("Crash: {e}");
        }
    }
}

async fn run(config: &SimpleConfig) -> Result<(), Box<dyn std::error::Error>> {
    let channel = Channel::Stable;
    let channel_cache = cache::WebChannelCache::new(channel);

    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 \
             (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        ),
    );
    let client = Client::builder().default_headers(headers).build()?;
    let response = client.get(URL).send().await?.text().await?;

    let server_config = web::read_server_config(&response)?;
    let version = server_config
        .get("clientVersion")
        .and_then(|v| v.as_str())
        .ok_or("Missing or invalid clientVersion")?
        .to_string();

    if let Some(old_version) = channel_cache.prev_version() {
        if old_version == version {
            return Ok(());
        }

        println!("Found new version {version}");
    }

    let old_data = channel_cache.read();

    let strings = web::read_strings(&response, &client).await?;
    let new_data = cache::WebCacheData { strings: strings };

    let diff = cache::WebCacheDiff::from(&old_data, &new_data);

    let response = AnnouncementBuilder::new(config.webhook.get_url())
        .add_version_component(
            channel.color(),
            channel.pretty_name(),
            version.clone(),
            "Web",
        )
        .add_map_diff_component("Strings", diff.strings)
        .send()
        .await;
    println!("Message response: {response:?}");

    channel_cache.write_prev_version(&version);

    Ok(())
}
