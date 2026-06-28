use announcer::diff::VecDiff;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct WebCacheData {
    pub version: String,
    pub build_date: String,
}

impl WebCacheData {
    pub fn new(content: &String) -> Self {}
}
