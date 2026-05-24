use arsc::ResourceValue;
use regex::Regex;
use std::collections::HashMap;
use std::io::{Cursor, Read, Seek, Write};
use tempfile;
use tempfile::NamedTempFile;
use zip::ZipArchive;

pub async fn temp_download_apk(url: String) -> NamedTempFile {
    let apk = reqwest::get(url)
        .await
        .expect("Couldn't download main APK")
        .bytes()
        .await
        .unwrap();
    let mut file = NamedTempFile::new().unwrap();
    file.write_all(&apk).expect("Couldn't write to tempfile");
    file
}

pub fn reader_from_apk_entry<R>(apk: R, entry: &str) -> Cursor<Vec<u8>>
where
    R: Read + Seek,
{
    let mut archive = ZipArchive::new(apk).expect("Couldn't read zip");
    let mut entry = archive.by_name(entry).expect("Couldn't find entry");

    let mut bytes = Vec::new();
    entry.read_to_end(&mut bytes).expect("Couldn't read to end");
    Cursor::new(bytes)
}

pub fn string_from_apk_entry<R>(apk: R, entry: &str) -> String
where
    R: Read + Seek,
{
    let mut archive = ZipArchive::new(apk).expect("Couldn't read zip");
    let entry = archive.by_name(entry).expect("Couldn't find entry");

    std::io::read_to_string(entry).expect("Couldn't read entry")
}

pub fn read_config_strings<R>(file: R) -> HashMap<String, String>
where
    R: Read + Seek,
{
    let mut strings = HashMap::<String, String>::new();

    let reader = reader_from_apk_entry(file, "resources.arsc");
    let a = arsc::parse_from(reader).expect("Couldn't parse arsc");

    for package in a.packages {
        for type_chunk in package.types {
            if let Some(type_name) = package.type_names.strings.get(type_chunk.id - 1) {
                if type_name != "string" {
                    continue;
                }

                for config in type_chunk.configs {
                    for resource in config.resources.resources {
                        let key = package
                            .key_names
                            .strings
                            .get(resource.name_index)
                            .expect("No key found");

                        match resource.value {
                            ResourceValue::Bag {
                                parent: _,
                                values: _,
                            } => {}
                            ResourceValue::Plain(v) => {
                                if let Some(value) = a.global_string_pool.strings.get(v.data_index)
                                {
                                    strings.insert(key.clone(), value.clone());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    strings
}

pub fn read_allow_list<R>(file: R) -> Vec<String>
where
    R: Read + Seek,
{
    let mut list: Vec<String> = vec![];

    let allow_list = string_from_apk_entry(file, "assets/app_remote_allow_list.csv");
    for line in allow_list.split('\n') {
        let parts: Vec<_> = line.split(',').collect();
        if let Some(package) = parts.get(0) {
            if !package.is_empty() {
                list.push(package.to_string());
            }
        }
    }

    list
}

pub fn read_licenses<R>(file: R) -> Vec<String>
where
    R: Read + Seek,
{
    let mut licenses: Vec<String> = vec![];

    let licenses_raw = string_from_apk_entry(file, "assets/licenses.xhtml");
    let re = Regex::new(r##"<a href="#.*?>(.*?)</a>"##).unwrap();
    for capture in re.captures_iter(&licenses_raw) {
        if let Some(group) = capture.get(1) {
            let s = group.as_str();
            if !s.is_empty() {
                licenses.push(s.to_string());
            }
        }
    }

    licenses
}
