use std::fs::read_to_string;

use serde::Deserialize;

use crate::{CONFIG_FILE_NAME, get_data_path};

#[derive(Deserialize)]
pub struct SimpleConfig {
    pub webhook: WebhookConfig,
}

impl SimpleConfig {
    pub fn read(cache_variant: &str) -> Self {
        let config_file_path = get_data_path(cache_variant).join(CONFIG_FILE_NAME);
        if !config_file_path.exists() {
            panic!("No config file found");
        }

        if let Ok(config_file) = read_to_string(config_file_path) {
            return toml::from_str(&config_file).expect("Couldn't parse config file");
        }

        panic!("Couldn't read config file");
    }
}

#[derive(Deserialize)]
pub struct WebhookConfig {
    url: String,
    debug_url: String,
}

impl WebhookConfig {
    pub fn get_url(&self) -> String {
        if cfg!(debug_assertions) {
            self.debug_url.clone()
        } else {
            self.url.clone()
        }
    }
}
