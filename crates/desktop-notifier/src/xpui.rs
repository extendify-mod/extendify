use regex::Regex;
use std::collections::HashMap;

pub fn extract_licenses(html: &str) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let mut result = HashMap::<String, String>::new();

    let toc_re = Regex::new(r#"(?s)<ul class="toc">(.*?)</ul>"#)?;
    let toc_content = toc_re
        .captures(html)
        .ok_or("could not find <ul class=\"toc\"> block")?
        .get(1)
        .unwrap()
        .as_str();

    let license_re = Regex::new(r#"<li><a href="[^"]*">([^<]*)</a></li>"#)?;
    for groups in license_re.captures_iter(toc_content) {
        let capture = groups[1].to_string();
        let split_idx = capture.rfind('@').ok_or("no @")?;
        let parts = capture.split_at(split_idx);

        result.insert(parts.0.to_string(), parts.1[1..].to_string());
    }

    Ok(result)
}
