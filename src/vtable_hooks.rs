use crate::cef::utils::{ctos, stoc};
use crate::cef::{
    _cef_browser_t, _cef_client_t, _cef_frame_t, _cef_render_process_handler_t,
    _cef_request_handler_t, _cef_request_t, _cef_resource_request_handler_t, _cef_v8_context_t,
    cef_string_t,
};
use crate::{callbacks, log};
use std::ffi::c_int;

#[allow(unused)]
pub static mut ON_CONTEXT_CREATED_OG: Option<
    unsafe extern "C" fn(
        *mut _cef_render_process_handler_t,
        *mut _cef_browser_t,
        *mut _cef_frame_t,
        *mut _cef_v8_context_t,
    ),
> = None;
#[allow(unused)]
pub unsafe extern "C" fn on_context_created_hook(
    self_: *mut _cef_render_process_handler_t,
    browser: *mut _cef_browser_t,
    frame: *mut _cef_frame_t,
    context: *mut _cef_v8_context_t,
) {
    log(format!("Context created on PID {}", std::process::id()));

    callbacks::on_frame(frame);

    unsafe {
        if let Some(func) = ON_CONTEXT_CREATED_OG {
            return func(self_, browser, frame, context);
        }
    }

    log("Couldn't call original on_context_created");
}

pub static mut RES_HANDLER_OG: Option<
    unsafe extern "C" fn(
        *mut _cef_request_handler_t,
        *mut _cef_browser_t,
        *mut _cef_frame_t,
        *mut _cef_request_t,
        c_int,
        c_int,
        *const cef_string_t,
        *mut c_int,
    ) -> *mut _cef_resource_request_handler_t,
> = None;
pub unsafe extern "C" fn res_handler_hook(
    self_: *mut _cef_request_handler_t,
    browser: *mut _cef_browser_t,
    frame: *mut _cef_frame_t,
    request: *mut _cef_request_t,
    is_navigation: c_int,
    is_download: c_int,
    initiator: *const cef_string_t,
    disable_default_handling: *mut c_int,
) -> *mut _cef_resource_request_handler_t {
    unsafe {
        callbacks::on_frame(frame);

        let url = ctos((*request).get_url.unwrap()(request));
        if url.ends_with("/xpui.js") || url.ends_with("/xpui-snapshot.js") {
            let header = (*request).get_header_by_name.unwrap()(request, stoc("extendify"));
            if header.is_null() {
                log("Blocked entrypoint");

                return std::ptr::null_mut();
            }
        }

        if let Some(func) = RES_HANDLER_OG {
            return func(
                self_,
                browser,
                frame,
                request,
                is_navigation,
                is_download,
                initiator,
                disable_default_handling,
            );
        }
    }

    log("Couldn't call original res handler");
    std::ptr::null_mut()
}

#[allow(unused)]
pub static mut GET_REQ_HANDLER_OG: Option<
    unsafe extern "C" fn(*mut _cef_client_t) -> *mut _cef_request_handler_t,
> = None;
#[allow(unused)]
pub unsafe extern "C" fn get_req_handler_hook(
    self_: *mut _cef_client_t,
) -> *mut _cef_request_handler_t {
    unsafe {
        if let Some(func) = GET_REQ_HANDLER_OG {
            let handler = func(self_);

            RES_HANDLER_OG = (*handler).get_resource_request_handler;
            (*handler).get_resource_request_handler = Some(res_handler_hook);

            return handler;
        }
    }

    log("Couldn't call original req handler");
    std::ptr::null_mut()
}
