#![allow(unused_variables)]

use crate::cef::{
    _cef_browser_settings_t, _cef_browser_view_delegate_t, _cef_browser_view_t, _cef_client_t,
    _cef_dictionary_value_t, _cef_request_context_t, cef_string_t,
};
use crate::{log, vtable_hooks};

#[macro_use]
#[cfg(target_os = "linux")]
mod preload;

#[macro_use]
#[cfg(target_os = "macos")]
mod dyld;

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
