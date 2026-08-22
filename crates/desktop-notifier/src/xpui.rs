use regex::Regex;

pub fn extract_licenses(html: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let toc_re = Regex::new(r#"(?s)<ul class="toc">(.*?)</ul>"#)?;
    let toc_content = toc_re
        .captures(html)
        .ok_or("could not find <ul class=\"toc\"> block")?
        .get(1)
        .unwrap()
        .as_str();

    let li_re = Regex::new(r#"<li><a href="[^"]*">([^<]*)</a></li>"#)?;

    let entries: Vec<String> = li_re
        .captures_iter(toc_content)
        .map(|cap| cap[1].to_string())
        .collect();

    Ok(entries)
}
