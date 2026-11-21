use crate::cef::_cef_frame_t;
use crate::cef::utils::{ctos, stoc};
use crate::is_renderer;
use common::consts;
use log::{debug, error, info, warn};
use std::fmt::Display;
use std::path::PathBuf;
use std::sync::Mutex;

const VALID_FRAME_URL: &str = "https://xpui.app.spotify.com/index.html";

static INJECTED_FRAMES: Mutex<Vec<String>> = Mutex::new(vec![]);

fn execute_java_script<T: Display>(frame: *mut _cef_frame_t, script: T, js: T) {
    unsafe {
        (*frame).execute_java_script.unwrap()(frame, stoc(js), stoc(script), 0);
    }
}

pub fn on_frame(frame: *mut _cef_frame_t) {
    if !is_renderer() {
        return;
    }

    let frame_url = ctos(unsafe { (*frame).get_url.unwrap()(frame) });
    if frame_url.as_str() != VALID_FRAME_URL {
        return;
    }

    if let Ok(mut guard) = INJECTED_FRAMES.lock() {
        let id = ctos(unsafe { (*frame).get_identifier.unwrap()(frame) });

        if guard.contains(&id) {
            return;
        }

        debug!("Found new frame id {id} ({})", std::process::id());

        guard.push(id);
    } else {
        error!("Lock failed");
        return;
    }

    info!("Injecting Extendify");

    if let Some(script) = get("extendify.js") {
        execute_java_script(frame, "extendify_script", &script);

        debug!("Injected script");
    }

    if let Some(style) = get("extendify.css") {
        let script = include_str!("./inject/styles.js").replace("{{style}}", &style);
        execute_java_script(frame, "extendify_styles", &script);

        debug!("Injected styles");
    }
}

fn get(filename: &str) -> Option<String> {
    if let Ok(extendify_dist) = std::env::var("EXTENDIFY_DIST") {
        let mut path = PathBuf::from(extendify_dist);
        path.push(filename);

        if let Ok(content) = std::fs::read_to_string(path) {
            debug!("Loading locally built file {filename}");
            return Some(content);
        }

        warn!("Couldn't open local file {filename}, falling back to release");
    }

	let mut path = consts::paths::extendify_dist();
	path.push(filename);

	std::fs::read_to_string(path).ok()
}
