use std::path::PathBuf;

use crate::diff::{MapDiff, VecDiff};
use reqwest::Client;
use serde::Deserialize;
use serde_json::json;

pub mod cache;
pub mod channel;
pub mod diff;

pub fn get_data_path(variant: &str) -> PathBuf {
    return PathBuf::from(format!("./data/{variant}"));
}

fn push_diff(title: &str, string: String, components: &mut Vec<serde_json::Value>) {
    components.push(json!({
        "type": 10,
        "content": format!("### {title}"),
    }));
    components.push(json!({ "type": 14 }));
    components.push(json!({
        "type": 10,
        "content": format!("```diff\n{string}```"),
    }));
}

fn push_diff_container<'a>(
    title: &str,
    base: &'a mut serde_json::Value,
) -> &'a mut Vec<serde_json::Value> {
    let components = base.get_mut("components").unwrap().as_array_mut().unwrap();
    components.push(json!({
        "type": 17,
        "components": [
            {
                "type": 10,
                "content": format!("## {title}"),
            },
        ],
    }));
    components
        .last_mut()
        .unwrap()
        .as_object_mut()
        .unwrap()
        .get_mut("components")
        .unwrap()
        .as_array_mut()
        .unwrap()
}

pub struct AnnouncementBuilder {
    pub webhook_url: String,
    pub json: serde_json::Value,
}

impl AnnouncementBuilder {
    pub fn new(webhook_url: String) -> Self {
        Self {
            webhook_url: webhook_url,
            json: json!({
                "flags": 1 << 15,
                "components": []
            }),
        }
    }

    pub fn add_version_component(
        mut self,
        color: u32,
        channel_name: String,
        version_string: String,
        platform_string: &str,
    ) -> Self {
        self.json
            .get_mut("components")
            .unwrap()
            .as_array_mut()
            .unwrap()
            .push(
                json!({
                    "type": 17,
                    "accent_color": color,
                    "components": [
                        {
                            "type": 10,
                            "content": format!("## New {channel_name} Version"),
                        },
                        { "type": 14 },
                        {
                            "type": 10,
                            "content": format!("**{version_string}** released for **{platform_string}**")
                        },
                    ],
                })
            );
        self
    }

    pub fn add_vec_diff_component(mut self, title: &str, diff: VecDiff) -> Self {
        if !diff.changed() {
            return self;
        }

        let diff_components = push_diff_container(title, &mut self.json);

        if !diff.added.is_empty() {
            push_diff(
                "Added",
                diff.added
                    .iter()
                    .map(|s| format!("+ {s}"))
                    .collect::<Vec<_>>()
                    .join("\n"),
                diff_components,
            );
        }

        if !diff.removed.is_empty() {
            push_diff(
                "Removed",
                diff.removed
                    .iter()
                    .map(|s| format!("- {s}"))
                    .collect::<Vec<_>>()
                    .join("\n"),
                diff_components,
            );
        }

        self
    }

    pub fn add_map_diff_component(mut self, title: &str, diff: MapDiff) -> Self {
        if !diff.changed() {
            return self;
        }

        let diff_components = push_diff_container(title, &mut self.json);

        if !diff.added.is_empty() {
            push_diff(
                "Added",
                diff.added
                    .iter()
                    .map(|(key, value)| format!("+ {key}: {value}"))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
                diff_components,
            );
        }

        if !diff.removed.is_empty() {
            push_diff(
                "Removed",
                diff.removed
                    .iter()
                    .map(|(key, value)| format!("- {key}: {value}"))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
                diff_components,
            );
        }

        if !diff.changed.is_empty() {
            push_diff(
                "Changed",
                diff.changed
                    .iter()
                    .map(|(key, value)| format!("- {key}: {}\n+ {key}: {}", value.old, value.new))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
                diff_components,
            );
        }

        self
    }

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
    pub fn get_url(&self) -> String {
        if cfg!(debug_assertions) {
            self.debug_url.clone()
        } else {
            self.url.clone()
        }
    }
}
