use crate::cef::_cef_frame_t;
use crate::cef::utils::{ctos, stoc};
use crate::{is_renderer, log};
use std::fmt::Display;
use std::path::PathBuf;
use std::sync::Mutex;

const URL_BASE: &str = "https://github.com/extendify-mod/extendify/releases/download/artifacts/";

static INJECTED: Mutex<Vec<String>> = Mutex::new(vec![]);

fn execute_java_script<T: Display>(frame: *mut _cef_frame_t, script: T, js: T) {
    unsafe {
        (*frame).execute_java_script.unwrap()(frame, stoc(js), stoc(script), 0);
    }
}

pub fn on_frame(frame: *mut _cef_frame_t) {
    if !is_renderer() {
        return;
    }

    if let Ok(mut guard) = INJECTED.lock() {
        let id = ctos(unsafe { (*frame).get_identifier.unwrap()(frame) });

        if guard.contains(&id) {
            return;
        }

        log(format!("Found new frame id {id} ({})", std::process::id()));

        guard.push(id);
    } else {
        log("Lock failed");
        return;
    }

    log("Injecting Extendify");

    if let Some(script) = get("extendify.js") {
        execute_java_script(frame, "extendify_script", &script);

        log("Injected script");
    }

    if let Some(style) = get("extendify.css") {
        let script = include_str!("./inject/styles.js").replace("{{style}}", &style);
        execute_java_script(frame, "extendify_styles", &script);

        log("Injected styles");
    }
}

fn get(filename: &str) -> Option<String> {
    if let Ok(extendify_root) = std::env::var("EXTENDIFY_ROOT") {
        let mut path = PathBuf::new();
        path.push(extendify_root);
        path.push("dist");
        path.push(filename);

        if let Ok(content) = std::fs::read_to_string(path) {
            log(format!("Loading locally built file {filename}"));
            return Some(content);
        }

        log("Couldn't open local file, falling back to release");
    }

    reqwest::blocking::get(format!("{URL_BASE}/{filename}"))
        .and_then(|r| r.text())
        .map_err(|e| log(format!("Request failed: {e}")))
        .ok()
}
