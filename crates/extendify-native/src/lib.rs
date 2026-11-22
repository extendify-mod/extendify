use std::env;

use ctor::ctor;
use log::LevelFilter;

mod callbacks;
mod cef;
mod persistence;
mod vtable_hooks;

#[cfg(unix)]
mod unix;
#[cfg(windows)]
mod win;

#[ctor(unsafe)]
fn main() {
	let level = if env::var("EXTENDIFY_DEBUG").is_ok() { LevelFilter::Debug }
	else { LevelFilter::Info };

	common::log::Logger::build()
		.level(level)
		.target_level("goblin", LevelFilter::Warn)
		.target_level("apple_codesign", LevelFilter::Warn)
		.target_level("reqwest", LevelFilter::Warn)
		.init();

	#[cfg(target_os = "windows")]
	win::create_hooks();

	persistence::init();
}

pub fn is_renderer() -> bool {
    if cfg!(windows) {
        std::env::args().any(|arg| arg.contains("--type=renderer"))
    } else {
        true
    }
}
