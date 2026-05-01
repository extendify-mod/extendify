use std::fmt::Display;
use std::fs::OpenOptions;
use std::io::Write;

mod callbacks;
mod cef;
mod vtable_hooks;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "windows")]
mod win;

pub fn log<T: Display>(msg: T) {
    println!("{msg}");

    #[cfg(debug_assertions)]
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("spotify_hook.log")
    {
        writeln!(file, "{msg}").ok();
    }
}
