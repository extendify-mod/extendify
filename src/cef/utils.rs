// TODO: https://github.com/extendify-mod/native-next/blob/master/src/handler.h
use crate::cef::cef_string_t;
use std::fmt::Display;

pub fn ctos(s: *const cef_string_t) -> String {
    if s.is_null() {
        return String::new();
    }

    unsafe {
        let s = &*s;

        if s.str_.is_null() || s.length == 0 {
            return String::new();
        }

        let slice = std::slice::from_raw_parts(s.str_, s.length);

        String::from_utf16_lossy(slice)
    }
}

extern "C" fn cef_string_dtor(ptr: *mut u16) {
    if !ptr.is_null() {
        unsafe {
            let _ = Vec::from_raw_parts(ptr, 0, 0);
        }
    }
}

pub fn stoc<T: Display>(value: T) -> *const cef_string_t {
    let string = value.to_string();

    if string.is_empty() {
        return std::ptr::null();
    }

    let mut utf16: Vec<u16> = string.encode_utf16().collect();
    let ptr = utf16.as_mut_ptr();
    let len = utf16.len();

    std::mem::forget(utf16);

    let cef = Box::new(cef_string_t {
        str_: ptr,
        length: len,
        dtor: Some(cef_string_dtor),
    });

    Box::into_raw(cef)
}
