use crate::cef::utils::{ctos, stoc};
use crate::cef::{_cef_frame_t, _cef_settings_t};
use crate::{is_renderer, log};
use std::path::PathBuf;
use std::sync::Mutex;
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

static INJECTED: Mutex<Vec<String>> = Mutex::new(vec![]);

pub fn on_frame(frame: *mut _cef_frame_t) {
    if !is_renderer() {
        return;
    }

    if let Ok(mut guard) = INJECTED.lock() {
        let id = unsafe { ctos((*frame).get_identifier.unwrap()(frame)) };

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
}

fn get(filename: &str) -> Option<String> {
    if let Ok(extendify_root) = std::env::var("EXTENDIFY_ROOT") {
        let mut path = PathBuf::new();
        path.push(extendify_root);
        path.push("packages/mod/dist");
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
