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
            .open("extendify.log")
        {
            writeln!(file, "{msg}").ok();
        }

        #[cfg(windows)]
        {
            use windows_sys::Win32::System::Diagnostics::Debug::OutputDebugStringW;

            let wide: Vec<_> = msg
                .to_string()
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();

            unsafe {
                OutputDebugStringW(wide.as_ptr());
            }
        }
    }
}

pub fn is_renderer() -> bool {
    if cfg!(windows) {
        std::env::args().any(|arg| arg.contains("--type=renderer"))
    } else {
        true
    }
}
