use std::path::PathBuf;

use crate::diff::{MapDiff, VecDiff};
use reqwest::Client;
use serde::Deserialize;
use serde_json::json;

pub mod cache;
pub mod channel;
pub mod diff;

const CHARACTER_LIMIT: usize = 4000 - 50;
const MESSAGE_FLAGS: u32 = 1 << 15;

pub fn get_data_path(variant: &str) -> PathBuf {
    return PathBuf::from(format!("./data/{variant}"));
}

fn create_diff_messages<'a>(
    title: &str,
    subtitle: &str,
    diff_string: String,
) -> Vec<serde_json::Value> {
    let content = format!("```diff\n{diff_string}```");

    if content.len() < 4000 {
        vec![json!({
            "type": 10,
            "content": content
        })]
    } else {
        let mut current_chunks: Vec<serde_json::Value> = vec![];

        let mut remaining = diff_string.as_str();
        while !remaining.is_empty() {
            let split_at = if remaining.len() <= CHARACTER_LIMIT {
                remaining.len()
            } else {
                remaining[..CHARACTER_LIMIT]
                    .rfind("\n\n")
                    .map(|i| i + 1)
                    .unwrap_or(CHARACTER_LIMIT)
            };

            let (chunk, rest) = remaining.split_at(split_at);
            remaining = rest;

            current_chunks.push(json!({
                "type": 10,
                "content": format!("```diff\n{chunk}```"),
            }));
        }

        current_chunks
    }
    .iter()
    .map(|c| {
        json!({
            "flags": MESSAGE_FLAGS,
            "components": [
                {
                    "type": 17,
                    "components": [
                        {
                            "type": 10,
                            "content": format!("## {title} - {subtitle}"),
                        },
                        { "type": 14 },
                        c
                    ],
                },
            ],
        })
    })
    .collect::<Vec<_>>()
}

pub struct AnnouncementBuilder {
    pub webhook_url: String,
    pub json: serde_json::Value,
    message_payloads: Vec<serde_json::Value>,
}

impl AnnouncementBuilder {
    pub fn new(webhook_url: String) -> Self {
        Self {
            webhook_url: webhook_url,
            json: json!({
                "flags": 1 << 15,
                "components": []
            }),
            message_payloads: vec![],
        }
    }

    pub fn add_version_component(
        mut self,
        color: u32,
        channel_name: String,
        version_string: String,
        platform_string: &str,
    ) -> Self {
        self.message_payloads.push(json!({
            "flags": MESSAGE_FLAGS,
            "components": [
                {
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
                },
            ],
        }));

        self
    }

    pub fn add_vec_diff_component(mut self, title: &str, diff: VecDiff) -> Self {
        if !diff.changed() {
            return self;
        }

        if !diff.added.is_empty() {
            self.message_payloads.extend(create_diff_messages(
                title,
                "Added",
                diff.added
                    .iter()
                    .map(|s| format!("+ {s}"))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
            ));
        }

        if !diff.removed.is_empty() {
            self.message_payloads.extend(create_diff_messages(
                title,
                "Removed",
                diff.removed
                    .iter()
                    .map(|s| format!("- {s}"))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
            ));
        }

        self
    }

    pub fn add_map_diff_component(mut self, title: &str, diff: MapDiff) -> Self {
        if !diff.changed() {
            return self;
        }

        if !diff.added.is_empty() {
            self.message_payloads.extend(create_diff_messages(
                title,
                "Added",
                diff.added
                    .iter()
                    .map(|(key, value)| format!("+ {key}: {value}"))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
            ));
        }

        if !diff.removed.is_empty() {
            self.message_payloads.extend(create_diff_messages(
                title,
                "Removed",
                diff.removed
                    .iter()
                    .map(|(key, value)| format!("- {key}: {value}"))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
            ));
        }

        if !diff.changed.is_empty() {
            self.message_payloads.extend(create_diff_messages(
                title,
                "Changed",
                diff.changed
                    .iter()
                    .map(|(key, value)| format!("- {key}: {}\n+ {key}: {}", value.old, value.new))
                    .collect::<Vec<_>>()
                    .join("\n\n"),
            ));
        }

        self
    }

    pub async fn send(self) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let mut responses: Vec<String> = vec![];
        let client = Client::new();

        for payload in self.message_payloads {
            let response = client
                .post(format!("{}?with_components=true", self.webhook_url))
                .json(&payload)
                .send()
                .await?
                .text()
                .await?;
            responses.push(response);
        }

        Ok(responses)
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
