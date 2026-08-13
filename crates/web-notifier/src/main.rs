use crate::config::Config;
use crate::constants::{CONFIG_ID, URL};
use announcer::AnnouncementBuilder;
use announcer::cache::ChannelCache;
use announcer::channel::Channel;
use base64::{Engine as _, engine::general_purpose};
use regex::Regex;
use reqwest::Client;
use serde_json::Value;
use tokio::time;

mod cache;
mod config;
mod constants;

#[tokio::main]
async fn main() {
    let config = Config::read();

    let mut interval = time::interval(time::Duration::from_mins(10));

    loop {
        interval.tick().await;

        if let Err(e) = run(&config).await {
            eprintln!("Crash: {e}")
        }
    }
}

async fn run(config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    let channel = Channel::Stable;
    let channel_cache = cache::WebChannelCache::new(channel);

    let client = Client::new();
    let response = client.get(URL).send().await?.text().await?;

    let pattern = format!(r#"<script id=\"{CONFIG_ID}\" type=\"text/plain\">(.*?)</script>"#);
    let re = Regex::new(&pattern).unwrap();

    if let Some(groups) = re.captures(&response) {
        let content = &groups[1];
        let decoded = general_purpose::STANDARD.decode(content)?;
        let json: Value = serde_json::from_slice(&decoded)?;

        let version = json
            .get("clientVersion")
            .and_then(|v| v.as_str())
            .ok_or("missing or invalid clientVersion")?
            .to_string();
        let build_date = json
            .get("buildDate")
            .and_then(|v| v.as_str())
            .ok_or("missing or invalid buildDate")?
            .to_string();

        if let Some(old_version) = channel_cache.prev_version() {
            if old_version == version {
                return Ok(());
            }

            println!("Found new version {}", version);
        }

        let response = AnnouncementBuilder::new(config.webhook.get_url())
            .add_version_component(
                channel.color(),
                channel.pretty_name(),
                format!("{version} ({build_date})"),
                "Web",
            )
            .send()
            .await;
        println!("Message response: {response:?}");

        channel_cache.write_prev_version(&version);

        Ok(())
    } else {
        Err("no groups captured".into())
    }
}
