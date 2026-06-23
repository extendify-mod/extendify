#[allow(unused_macros)]
macro_rules! extern_c_overrides {
    (unsafe fn $c_api:ident/$real_api:ident($($param_name:ident : $param_type:ty),*) -> $return_type:ty $override_body:block $($more_tokens:tt)*) => {

        pub unsafe fn $real_api($($param_name: $param_type),*) -> $return_type {
            use std::ffi::{c_char, c_void};
            use std::sync::OnceLock;

            unsafe extern "C" {
                fn dlsym(handle: *const c_void, symbol: *const c_char) -> *const c_void;
            }

            #[allow(non_camel_case_types)]
            type $c_api = unsafe fn($($param_type),*) -> $return_type;

            #[allow(non_upper_case_globals)]
            static _dl_resolver: OnceLock<$c_api> = OnceLock::new();

            let real_fn = _dl_resolver.get_or_init(|| {
                unsafe {
                    const RTLD_NEXT: *const c_void = -1isize as *const c_void;
                    let sym = dlsym(
                        RTLD_NEXT,
                        concat!(stringify!($c_api), "\0").as_ptr() as *const c_char,
                    );
                    if sym.is_null() {
                        panic!("dlsym(RTLD_NEXT): cannot find {}", stringify!($c_api));
                    }
                    core::mem::transmute(sym)
                }
            });

            unsafe { real_fn($($param_name),*) }
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
