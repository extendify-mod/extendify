use crate::constants::CONFIG_FILE_NAME;
use announcer::WebhookConfig;
use announcer::channel::Channel;
use serde::Deserialize;
use std::fs::read_to_string;
use std::path::Path;

#[derive(Deserialize)]
pub struct Config {
    pub stable_channel: ChannelConfig,
    pub beta_channel: ChannelConfig,
    pub alpha_channel: ChannelConfig,
    pub webhook: WebhookConfig,
}

impl Config {
    pub fn read() -> Config {
        let config_file_path = Path::new(env!("CARGO_MANIFEST_DIR")).join(CONFIG_FILE_NAME);
        if !config_file_path.exists() {
            panic!("No config file found");
        }

        if let Ok(config_file) = read_to_string(config_file_path) {
            return toml::from_str(&config_file).expect("Couldn't parse config file");
        }

        panic!("Couldn't read config file");
    }

    pub fn get_channel_config(&self, channel: &Channel) -> ChannelConfig {
        match channel {
            Channel::Stable => self.stable_channel.clone(),
            Channel::Beta => self.beta_channel.clone(),
            Channel::Alpha => self.alpha_channel.clone(),
        }
    }
}

#[derive(Deserialize, Clone)]
pub struct ChannelConfig {
    pub email: String,
    pub aas_token: String,
}
