use enum_iterator::Sequence;
use std::fmt::{Display, Formatter};
use std::path::PathBuf;

#[derive(Sequence, Copy, Clone, Default)]
pub enum Channel {
    #[default]
    Stable,
    Beta,
    Alpha,
}

impl Display for Channel {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Channel::Stable => write!(f, "stable"),
            Channel::Beta => write!(f, "beta"),
            Channel::Alpha => write!(f, "alpha"),
        }
    }
}

impl Channel {
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s.to_lowercase().as_str() {
            "stable" => Ok(Channel::Stable),
            "beta" => Ok(Channel::Beta),
            "alpha" => Ok(Channel::Beta),
            _ => Err(format!("Invalid release channel {s}")),
        }
    }

    pub fn pretty_name(&self) -> String {
        let string = self.to_string();
        let mut c = string.chars();
        match c.next() {
            None => String::new(),
            Some(f) => f.to_uppercase().to_string() + c.as_str(),
        }
    }

    pub fn id(&self) -> String {
        let string = self.to_string();
        string
            .chars()
            .find(|c| !c.is_whitespace())
            .unwrap_or('s')
            .to_string()
    }

    pub fn color(&self) -> u32 {
        match self {
            Self::Stable => 0x98fc03,
            Self::Beta => 0xfcbe03,
            Self::Alpha => 0xe31254,
        }
    }

    pub fn get_data_path(&self, variant: &str) -> PathBuf {
        crate::get_data_path(variant).join(self.to_string())
    }
}
