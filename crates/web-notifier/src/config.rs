use std::fs::read_to_string;

use announcer::{CONFIG_FILE_NAME, WebhookConfig};
use serde::Deserialize;

use crate::constants::CACHE_VARIANT;

#[derive(Deserialize)]
pub struct Config {
    pub webhook: WebhookConfig,
}

impl Config {
    pub fn read() -> Config {
        let config_file_path = announcer::get_data_path(CACHE_VARIANT).join(CONFIG_FILE_NAME);
        if !config_file_path.exists() {
            panic!("No config file found");
        }

        if let Ok(config_file) = read_to_string(config_file_path) {
            return toml::from_str(&config_file).expect("Couldn't parse config file");
        }

        panic!("Couldn't read config file");
    }
}
