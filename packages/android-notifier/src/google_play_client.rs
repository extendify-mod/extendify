use crate::constants::{DEVICE_NAME, PACKAGE_NAME};
use announcer::channel::Channel;
use googleplay_protobuf::DetailsResponse;
use gpapi::Gpapi;
use gpapi::error::ErrorKind;

#[derive(Debug)]
pub struct DownloadFile {
    pub name: String,
    pub url: String,
}

#[derive(Debug)]
#[allow(unused, dead_code)]
pub struct DownloadInfo {
    pub main_apk_url: String,
    pub splits: Vec<DownloadFile>,
    pub additional_files: Vec<DownloadFile>,
    pub metadata_url: String,
}

#[derive(Debug)]
pub struct VersionInfo {
    pub version_string: String,
    pub version_code: i64,
}

pub struct GooglePlayClient {
    client: Gpapi,
    channel: Channel,
}

impl GooglePlayClient {
    pub fn new(channel: Channel, email: String, aas_token: String) -> Self {
        let mut client = Gpapi::new(DEVICE_NAME, &email);
        client.set_aas_token(aas_token);

        Self {
            client: client,
            channel: channel,
        }
    }

    pub async fn initialize(&mut self) -> Result<(), String> {
        match self.client.login().await {
            Ok(_) => Ok(()),
            Err(e) if matches!(e.kind(), ErrorKind::TermsOfService) => self
                .client
                .accept_tos()
                .await
                .map(|_| ())
                .map_err(|e| format!("Couldn't accept TOS for channel {}: {e:?}", self.channel)),
            Err(e) => Err(format!("Login error for channel {}: {e:?}", self.channel)),
        }
    }

    pub async fn get_details(&self) -> Result<Option<DetailsResponse>, String> {
        self.client
            .details(PACKAGE_NAME)
            .await
            .map_err(|e| format!("API error for channel {}: {e:?}", self.channel))
    }

    pub async fn get_download_info(&self, version: i64) -> Result<DownloadInfo, String> {
        match self
            .client
            .get_download_info(PACKAGE_NAME, Some(version))
            .await
        {
            Ok(info) => {
                return Ok(DownloadInfo {
                    main_apk_url: info.0.expect("No main APK url"),
                    splits: info
                        .1
                        .into_iter()
                        .map(|e| DownloadFile {
                            name: e.0.expect("No split filename"),
                            url: e.1.expect("No split url"),
                        })
                        .collect(),
                    additional_files: info
                        .2
                        .into_iter()
                        .map(|e| DownloadFile {
                            name: e.0.expect("No filename"),
                            url: e.1.expect("No url"),
                        })
                        .collect(),
                    metadata_url: info.3.expect("No metadata url"),
                });
            }
            Err(e) => return Err(format!("API error for channel {}: {e:?}", self.channel)),
        }
    }

    pub async fn get_latest_version(&self) -> Result<VersionInfo, String> {
        let res = self.get_details().await?;

        res.and_then(|r| r.item)
            .and_then(|i| i.details)
            .and_then(|d| d.app_details)
            .and_then(|a| {
                Some(VersionInfo {
                    version_code: a.version_code.expect("No version code"),
                    version_string: a.version_string.expect("No version string"),
                })
            })
            .ok_or_else(|| String::from("No item found. Try changing device name."))
    }
}
