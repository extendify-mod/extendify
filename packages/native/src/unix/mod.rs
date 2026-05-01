#![allow(unused_variables)]

use crate::cef::{
    _cef_app_t, _cef_browser_settings_t, _cef_browser_view_delegate_t, _cef_browser_view_t,
    _cef_client_t, _cef_dictionary_value_t, _cef_main_args_t, _cef_request_context_t,
    _cef_settings_t, cef_string_t,
};
use crate::{log, vtable_hooks};
use libc;
use std::ffi::{c_int, c_void};

#[macro_use]
mod preload;

extern_c_overrides! {
    unsafe fn cef_initialize/real_cef_initialize(
        args: *const _cef_main_args_t,
        settings: *mut _cef_settings_t,
        app: *mut _cef_app_t,
        _sandbox: *mut c_void
    ) -> c_int {
        log("CEF init call");

        crate::callbacks::on_entrypoint(settings);

        real_cef_initialize(args, settings, app, std::ptr::null_mut())
    }
}

extern_c_overrides! {
    unsafe fn cef_browser_view_create/real_cef_browser_view_create(
        client: *mut _cef_client_t,
        url: *const cef_string_t,
        settings: *const _cef_browser_settings_t,
        extra_info: *mut _cef_dictionary_value_t,
        request_context: *mut _cef_request_context_t,
        delegate: *mut _cef_browser_view_delegate_t
    ) -> *mut _cef_browser_view_t {
        log("CEF browser view created");

        let view = real_cef_browser_view_create(client, url, settings, extra_info, request_context, delegate);

        vtable_hooks::GET_REQ_HANDLER_OG = (*client).get_request_handler;
        (*client).get_request_handler = Some(vtable_hooks::get_req_handler_hook);

        view
    }
}
