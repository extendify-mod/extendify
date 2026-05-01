use crate::cef::utils::stoc;
use crate::cef::{_cef_frame_t, _cef_settings_t};
use crate::log;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering::Relaxed};
use ureq;

const URL_BASE: &str = "https://github.com/extendify-mod/extendify/releases/download/artifacts/";

pub fn on_entrypoint(settings: *mut _cef_settings_t) {
    unsafe {
        if (*settings).remote_debugging_port == 0 {
            (*settings).remote_debugging_port = 9229;
            log("Enabled remote debugging on port 9229");
        }
    }
}

static INJECTED: AtomicBool = AtomicBool::new(false);

pub fn on_frame(frame: *mut _cef_frame_t) {
    if INJECTED.load(Relaxed) {
        return;
    }

    log("Injecting Extendify");

    unsafe {
        if let Some(script) = get("extendify.js") {
            (*frame).execute_java_script.unwrap()(frame, stoc(script), stoc("extendify_script"), 0);

            log("Injected script");
        }

        if let Some(style) = get("extendify.css") {
            (*frame).execute_java_script.unwrap()(
                frame,
                stoc(include_str!("./inject/styles.js").replace("{{style}}", &style)),
                stoc("extendify_styles"),
                0,
            );

            log("Injected styles");
        }
    }

    INJECTED.store(true, Relaxed);
}

fn get(filename: &str) -> Option<String> {
    let extendify_root = env!("EXTENDIFY_ROOT");
    if !extendify_root.is_empty() {
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

    match ureq::get(format!("{URL_BASE}/{filename}")).call() {
        Ok(mut response) => match response.body_mut().read_to_string() {
            Ok(body) => {
                return Some(body);
            }
            Err(e) => {
                log(format!("Body failed {e}"));
            }
        },
        Err(e) => {
            log(format!("Call failed {e}"));
        }
    }

    None
}
