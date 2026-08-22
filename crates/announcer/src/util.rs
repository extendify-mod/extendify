use std::collections::HashMap;

use serde_json::Value;

pub fn flatten_json_map(json_str: &str) -> Result<HashMap<String, String>, serde_json::Error> {
    let value: Value = serde_json::from_str(json_str)?;
    let obj = value
        .as_object()
        .ok_or_else(|| serde::de::Error::custom("top-level JSON is not an object"))?;

    let mut out = HashMap::new();
    for (key, val) in obj {
        flatten_into(key.clone(), val, &mut out);
    }
    Ok(out)
}

fn flatten_into(prefix: String, val: &Value, out: &mut HashMap<String, String>) {
    match val {
        Value::String(s) => {
            out.insert(prefix, s.clone());
        }
        Value::Object(map) => {
            for (k, v) in map {
                flatten_into(format!("{prefix}.{k}"), v, out);
            }
        }
        other => {
            out.insert(prefix, other.to_string());
        }
    }
}
