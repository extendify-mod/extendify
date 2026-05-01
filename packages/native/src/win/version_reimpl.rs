use crate::win::log;
use core::ffi::c_void;
use windows_sys::Win32::Foundation::FARPROC;
use windows_sys::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryW};
use windows_sys::core::{BOOL, PCWSTR};

fn get_function(name: &[u8]) -> FARPROC {
    let dll_name: Vec<u16> = "C:\\Windows\\System32\\version.dll"
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let lib = LoadLibraryW(dll_name.as_ptr());
        if lib == std::ptr::null_mut() {
            log("Failed to load DLL");
            return None;
        }

        GetProcAddress(lib, name.as_ptr())
    }
}

macro_rules! proxy {
    (
        fn $name:ident($($arg:ident: $ty:ty),*) -> $ret:ty
    ) => {
        #[unsafe(no_mangle)]
        pub extern "system" fn $name($($arg: $ty),*) -> $ret {
            unsafe {
                if let Some(func) = get_function(concat!(stringify!($name), "\0").as_bytes()) {
                    let callable: unsafe extern "system" fn($($ty),*) -> $ret = std::mem::transmute(func);
                    log(format!("Forwarded {}", stringify!($name)));
                    return callable($($arg),*);
                }

                log("DLL not loaded");
                Default::default()
            }
        }
    };
}

proxy!(fn GetFileVersionInfoSizeW(filename: PCWSTR, handle: *mut u32) -> u32);

proxy!(fn GetFileVersionInfoW(filename: PCWSTR, handle: u32, len: u32, data: *mut c_void) -> BOOL);

proxy!(fn VerQueryValueW(pblock: *const c_void, sub_block: PCWSTR, buffer: *mut *mut c_void, len: *mut u32) -> BOOL);
