use std::fmt::Display;

mod callbacks;
mod cef;
mod vtable_hooks;

#[cfg(unix)]
mod unix;
#[cfg(windows)]
mod win;

pub fn log<T: Display>(msg: T) {
    println!("{msg}");

    #[cfg(debug_assertions)]
    {
        use std::fs::OpenOptions;
        use std::io::Write;

        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open("spotify_hook.log")
        {
            writeln!(file, "{msg}").ok();
        }
    }
}

pub fn is_renderer() -> bool {
    std::env::args()
        .collect::<Vec<_>>()
        .contains(&String::from("--type=renderer"))
}
