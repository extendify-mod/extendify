use crate::cef::{
    _cef_app_t, _cef_browser_settings_t, _cef_browser_view_delegate_t, _cef_browser_view_t,
    _cef_client_t, _cef_dictionary_value_t, _cef_main_args_t, _cef_request_context_t,
    _cef_settings_t, cef_string_t,
};
use crate::{log, vtable_hooks};
use slim_detours_sys::{
    SlimDetoursAttach, SlimDetoursTransactionBegin, SlimDetoursTransactionCommit,
};
use std::ffi::{CString, c_int, c_void};
use windows_sys::Win32::Foundation::HINSTANCE;
use windows_sys::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress, LoadLibraryW};
use windows_sys::Win32::System::SystemServices::{DLL_PROCESS_ATTACH, DLL_PROCESS_DETACH};
use windows_sys::core::BOOL;

mod version_reimpl;

#[unsafe(no_mangle)]
pub extern "system" fn DllMain(
    _hinst: HINSTANCE,
    fdw_reason: u32,
    _lpv_reserved: *mut c_void,
) -> BOOL {
    match fdw_reason {
        DLL_PROCESS_ATTACH => init_hooks(),
        DLL_PROCESS_DETACH => deinit_hooks(),
        _ => {}
    }

    1
}

fn get_libcef_name() -> Vec<u16> {
    "libcef.dll"
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect()
}

fn ensure_libcef() {
    let name = get_libcef_name();

    unsafe {
        let module = GetModuleHandleW(name.as_ptr());
        if module.is_null() {
            log("Force loading CEF");

            LoadLibraryW(name.as_ptr());
        }
    }
}

macro_rules! define_hook {
    ($symbol:expr, $hook:expr, $original:expr) => {
        unsafe {
            let module = GetModuleHandleW(get_libcef_name().as_ptr());
            if module.is_null() {
                log("Cef is not loaded");
                return;
            }

            let symbol_c = CString::new($symbol).unwrap();
            if let Some(target) = GetProcAddress(module, symbol_c.as_ptr() as _) {
                $original = Some(std::mem::transmute(target));

                SlimDetoursTransactionBegin();
                SlimDetoursAttach(std::ptr::addr_of_mut!($original) as _, $hook as _);
                let status = SlimDetoursTransactionCommit();

                if status >= 0 {
                    log(format!("Created hook for {}", $symbol));
                } else {
                    log(format!("Hook for {} failed {}", $symbol, status));
                }
            } else {
                log(format!("Couldn't find target symbol {}", $symbol));
            }
        }
    };
}

macro_rules! define_inline_hook {
    ($target: expr, $hook: expr, $original: expr) => {
        $original = Some(std::mem::transmute($target));

        SlimDetoursTransactionBegin();
        SlimDetoursAttach(std::ptr::addr_of_mut!($original) as _, $hook as _);
        let status = SlimDetoursTransactionCommit();

        if status >= 0 {
            log(format!("Created inline hook {}", stringify!($hook)));
        } else {
            log(format!(
                "Failed to create inlike hook {} {}",
                stringify!($hook),
                status
            ));
        }
    };
}

fn init_hooks() {
    ensure_libcef();

    define_hook!("cef_initialize", cef_initialize_hook, CEF_INITIALIZE_OG);
    define_hook!("cef_execute_process", cef_process_hook, CEF_PROCESS_OG);
    define_hook!("cef_browser_view_create", cef_view_hook, CEF_VIEW_OG);
}

fn deinit_hooks() {}

static mut CEF_INITIALIZE_OG: Option<
    unsafe extern "C" fn(
        *const _cef_main_args_t,
        *mut _cef_settings_t,
        *mut _cef_app_t,
        *mut c_void,
    ) -> c_int,
> = None;
unsafe extern "C" fn cef_initialize_hook(
    args: *const _cef_main_args_t,
    settings: *mut _cef_settings_t,
    app: *mut _cef_app_t,
    _sandbox: *mut c_void,
) -> c_int {
    log(format!("CEF init call on PID {}", std::process::id()));

    crate::callbacks::on_entrypoint(settings);

    unsafe {
        if let Some(func) = CEF_INITIALIZE_OG {
            return func(args, settings, app, std::ptr::null_mut());
        }
    }

    log("Couldn't call original cef_initialize");
    0
}

static mut CEF_PROCESS_OG: Option<
    unsafe extern "C" fn(*const _cef_main_args_t, *mut _cef_app_t, *mut c_void) -> c_int,
> = None;
unsafe extern "C" fn cef_process_hook(
    args: *const _cef_main_args_t,
    app: *mut _cef_app_t,
    _sandbox: *mut c_void,
) -> c_int {
    log(format!("Executing process on PID {}", std::process::id()));

    unsafe {
        if !app.is_null() {
            let rph = (*app).get_render_process_handler.unwrap()(app);
            if !rph.is_null() {
                if let Some(og) = (*rph).on_context_created {
                    define_inline_hook!(
                        og,
                        vtable_hooks::on_context_created_hook,
                        vtable_hooks::ON_CONTEXT_CREATED_OG
                    );
                }
            }
        }

        if let Some(func) = CEF_PROCESS_OG {
            return func(args, app, std::ptr::null_mut());
        }
    }

    log("Couldn't call original cef process");
    0
}

static mut CEF_VIEW_OG: Option<
    unsafe extern "C" fn(
        *mut _cef_client_t,
        *const cef_string_t,
        *const _cef_browser_settings_t,
        *mut _cef_dictionary_value_t,
        *mut _cef_request_context_t,
        *mut _cef_browser_view_delegate_t,
    ) -> *mut _cef_browser_view_t,
> = None;
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

        define_inline_hook!(
            og,
            vtable_hooks::res_handler_hook,
            vtable_hooks::RES_HANDLER_OG
        );

        if let Some(func) = CEF_VIEW_OG {
            return func(client, url, settings, extra_info, request_context, delegate);
        }
    }

    log("Couldn't call original view");
    std::ptr::null_mut()
}
