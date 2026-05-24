use derive_builder::Builder;
use reqwest::Client;
use serde::Deserialize;

#[derive(Builder)]
pub struct Announcement {
    #[builder(setter(into))]
    pub webhook_url: String,
    pub json: serde_json::Value,
}

impl Announcement {
    pub async fn send(self) -> Result<String, Box<dyn std::error::Error>> {
        let client = Client::new();
        let response = client
            .post(format!("{}?with_components=true", self.webhook_url))
            .json(&self.json)
            .send()
            .await?
            .text()
            .await?;

        Ok(response)
    }
}

#[derive(Deserialize)]
pub struct WebhookConfig {
    url: String,
    debug_url: String,
}

impl WebhookConfig {
    pub fn get_url(self) -> String {
        if cfg!(debug_assertions) {
            self.debug_url
        } else {
            self.url
        }
    }
}
