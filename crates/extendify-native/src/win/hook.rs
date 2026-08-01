use crate::log;
use std::ffi::{CString, c_void};
use std::sync::Mutex;

use slim_detours_sys::{
    SlimDetoursAttach, SlimDetoursTransactionBegin, SlimDetoursTransactionCommit,
};
use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress};

pub fn create_hook<T: Copy>(
    dll_name: &str,
    symbol: &str,
    hook: *mut c_void,
    original: &Mutex<Option<T>>,
) {
    let wide_name: Vec<_> = dll_name.encode_utf16().chain(std::iter::once(0)).collect();

    let module = unsafe { GetModuleHandleW(wide_name.as_ptr()) };
    if module.is_null() {
        log(format!("{} not loaded", dll_name));
        return;
    }

    let symbol_c = match CString::new(symbol) {
        Ok(s) => s,
        Err(_) => {
            log(format!("Invalid symbol name {}", symbol));
            return;
        }
    };

    let target = match unsafe { GetProcAddress(module, symbol_c.as_ptr() as _) } {
        Some(addr) => addr,
        None => {
            log(format!("Couldn't find target symbol {symbol}"));
            return;
        }
    };

    let mut guard = original.lock().unwrap();
    *guard = Some(unsafe { std::mem::transmute_copy::<_, T>(&target) });

    let status = unsafe {
        SlimDetoursTransactionBegin();
        SlimDetoursAttach(guard.as_mut().unwrap() as *mut T as *mut c_void as _, hook);
        SlimDetoursTransactionCommit()
    };

    if status >= 0 {
        log(format!("Created hook for {symbol}"));
    } else {
        log(format!("Hook for {symbol} failed {status}"));
    }
}

pub fn create_inline_hook<T: Copy>(
    target: T,
    hook: *mut c_void,
    original: &Mutex<Option<T>>,
    name: &str,
) {
    let mut guard = original.lock().unwrap();
    *guard = Some(target);

    let status = unsafe {
        SlimDetoursTransactionBegin();
        SlimDetoursAttach(guard.as_mut().unwrap() as *mut _ as _, hook);
        SlimDetoursTransactionCommit()
    };

    if status >= 0 {
        log(format!("Created inline hook {name}"));
    } else {
        log(format!("Hook for {name} failed {status}"));
    }
}
