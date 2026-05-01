// https://github.com/abutcher-gh/ld_preload_helpers/blob/main/src/lib.rs

#[allow(unused_macros)]
macro_rules! extern_c_overrides {
    (unsafe fn $c_api:ident/$real_api:ident($($param_name:ident : $param_type:ty),*) -> $return_type:ty $override_body:block $($more_tokens:tt)*) => {
        pub unsafe fn $real_api($($param_name: $param_type),*) -> $return_type {
            use std::ffi::{c_char, c_void};
            use std::sync::OnceLock;

            #[link(name = "dl")]
            unsafe extern "C" {
                #[allow(dead_code)]
                pub fn dlsym(handle: *const c_void, symbol: *const c_char) -> *const c_void;
            }

            #[allow(non_camel_case_types)]
            type $c_api = fn ($($param_name: $param_type),*) -> $return_type;

            #[allow(non_upper_case_globals)]
            static _dl_resolver: OnceLock<$c_api> = OnceLock::new();

            #[allow(unused)]
            let $c_api = _dl_resolver.get_or_init(|| {
                unsafe {
                    let sym = dlsym(-1isize as *const c_void, concat!(stringify!($c_api), "\0").as_ptr() as *const c_char);
                    if sym.is_null() {
                        panic!("dlsym: Cannot get address for {}", stringify!($c_api));
                    }
                    return core::mem::transmute(sym);
                }
            });
            $c_api($($param_name),*)
        }

        #[unsafe(no_mangle)]
        pub unsafe extern "C" fn $c_api($($param_name: $param_type),*) -> $return_type {
            unsafe {
                let $c_api = $real_api;
                $override_body
            }
        }

        extern_c_overrides! { $($more_tokens)* }
    };
    () => {};
}
