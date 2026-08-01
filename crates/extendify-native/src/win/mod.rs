use crate::cef::{
    _cef_app_t, _cef_browser_settings_t, _cef_browser_view_delegate_t, _cef_browser_view_t,
    _cef_client_t, _cef_dictionary_value_t, _cef_main_args_t, _cef_request_context_t,
    _cef_settings_t, cef_string_t,
};
use crate::{log, vtable_hooks};
use std::ffi::{c_int, c_void};
use std::sync::Mutex;
use windows_sys::Win32::Foundation::HINSTANCE;
use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleW, LoadLibraryW};
use windows_sys::Win32::System::SystemServices::DLL_PROCESS_ATTACH;
use windows_sys::core::BOOL;

mod hook;

#[unsafe(no_mangle)]
pub extern "system" fn DllMain(
    _hinst: HINSTANCE,
    fdw_reason: u32,
    _lpv_reserved: *mut c_void,
) -> BOOL {
    match fdw_reason {
        DLL_PROCESS_ATTACH => create_hooks(),
        _ => {}
    }

    1
}

fn ensure_libcef() {
    let name: Vec<_> = "libcef.dll"
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let module = GetModuleHandleW(name.as_ptr());
        if module.is_null() {
            log("Force loading CEF");

            LoadLibraryW(name.as_ptr());
        }
    }
}

fn create_hooks() {
    ensure_libcef();

    hook::create_hook(
        "libcef.dll",
        "cef_initialize",
        cef_initialize_hook as _,
        &CEF_INITIALIZE_OG,
    );
    hook::create_hook(
        "libcef.dll",
        "cef_execute_process",
        cef_process_hook as _,
        &CEF_PROCESS_OG,
    );
    hook::create_hook(
        "libcef.dll",
        "cef_browser_view_create",
        cef_view_hook as _,
        &CEF_VIEW_OG,
    );
}

static CEF_INITIALIZE_OG: Mutex<
    Option<
        unsafe extern "C" fn(
            *const _cef_main_args_t,
            *mut _cef_settings_t,
            *mut _cef_app_t,
            *mut c_void,
        ) -> c_int,
    >,
> = Mutex::new(None);
unsafe extern "C" fn cef_initialize_hook(
    args: *const _cef_main_args_t,
    settings: *mut _cef_settings_t,
    app: *mut _cef_app_t,
    sandbox: *mut c_void,
) -> c_int {
    log(format!("CEF init call on PID {}", std::process::id()));

    unsafe {
        (*settings).no_sandbox = 1;
        (*settings).command_line_args_disabled = 0;
    }

    if let Some(func) = CEF_INITIALIZE_OG.lock().ok().and_then(|g| *g) {
        return unsafe { func(args, settings, app, sandbox) };
    }

    log("Couldn't call original cef_initialize");
    0
}

static CEF_PROCESS_OG: Mutex<
    Option<unsafe extern "C" fn(*const _cef_main_args_t, *mut _cef_app_t, *mut c_void) -> c_int>,
> = Mutex::new(None);
unsafe extern "C" fn cef_process_hook(
    args: *const _cef_main_args_t,
    app: *mut _cef_app_t,
    sandbox: *mut c_void,
) -> c_int {
    log(format!("Executing process on PID {}", std::process::id()));

    if !app.is_null() {
        log("app not null");
        let rph = unsafe { (*app).get_render_process_handler.unwrap()(app) };
        if !rph.is_null() {
            log("rph not null");
            if let Some(og) = unsafe { (*rph).on_context_created } {
                hook::create_inline_hook(
                    og,
                    vtable_hooks::on_context_created_hook as _,
                    &vtable_hooks::ON_CONTEXT_CREATED_OG,
                    "on_context_created",
                );
            }
        }
    }

    if let Some(func) = CEF_PROCESS_OG.lock().ok().and_then(|g| *g) {
        unsafe { func(args, app, sandbox) }
    } else {
        log("Couldn't call original cef process");
        0
    }
}

static CEF_VIEW_OG: Mutex<
    Option<
        unsafe extern "C" fn(
            *mut _cef_client_t,
            *const cef_string_t,
            *const _cef_browser_settings_t,
            *mut _cef_dictionary_value_t,
            *mut _cef_request_context_t,
            *mut _cef_browser_view_delegate_t,
        ) -> *mut _cef_browser_view_t,
    >,
> = Mutex::new(None);
unsafe extern "C" fn cef_view_hook(
    client: *mut _cef_client_t,
    url: *const cef_string_t,
    settings: *const _cef_browser_settings_t,
    extra_info: *mut _cef_dictionary_value_t,
    request_context: *mut _cef_request_context_t,
    delegate: *mut _cef_browser_view_delegate_t,
) -> *mut _cef_browser_view_t {
    unsafe {
        let req_handler = (*client).get_request_handler.unwrap()(client);
        let og = (*req_handler).get_resource_request_handler.unwrap();

        hook::create_inline_hook(
            og,
            vtable_hooks::res_handler_hook as _,
            &vtable_hooks::RES_HANDLER_OG,
            "res_handler",
        );

        if let Some(func) = CEF_VIEW_OG.lock().ok().and_then(|g| *g) {
            return func(client, url, settings, extra_info, request_context, delegate);
        }
    }

    log("Couldn't call original view");
    std::ptr::null_mut()
}
