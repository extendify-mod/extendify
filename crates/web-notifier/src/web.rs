use crate::constants::CONFIG_ID;
use announcer::util;
use base64::{Engine as _, engine::general_purpose};
use regex::Regex;
use reqwest::Client;
use serde_json::Value;
use std::collections::HashMap;

pub fn read_server_config(html: &str) -> Result<Value, Box<dyn std::error::Error>> {
    let pattern = format!(r#"<script id=\"{CONFIG_ID}\" type=\"text/plain\">(.*?)</script>"#);
    let re = Regex::new(&pattern)?;

    if let Some(groups) = re.captures(html) {
        let content = &groups[1];
        let decoded = general_purpose::STANDARD.decode(content)?;
        let json: Value = serde_json::from_slice(&decoded)?;

        Ok(json)
    } else {
        Err("Server config couldn't be found".into())
    }
}

pub async fn read_strings(
    html: &str,
    client: &Client,
) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let re = Regex::new(r#"<link[^>]*\brel="preload"[^>]*\bhref="([^"]+\.json)"[^>]*>"#)?;

    if let Some(groups) = re.captures(html) {
        let url = &groups[1];
        println!("{url}");
        let response = client.get(url).send().await?.text().await?;
        println!("{response}");
        let strings = util::flatten_json_map(&response)?;
        Ok(strings)
    } else {
        Err("No generated locale found".into())
    }
}
