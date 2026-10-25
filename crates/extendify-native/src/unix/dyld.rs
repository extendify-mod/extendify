// https://github.com/geofft/redhook/blob/master/src/dyld_insert_libraries.rs

#[macro_export]
macro_rules! extern_c_overrides {
    (unsafe fn $c_api:ident/$real_api:ident ($($param_name:ident : $param_type:ty),* ) -> $return_type:ty $override_body:block) => {
        pub mod $c_api {
            #[allow(non_camel_case_types)]
            pub struct $c_api {
                _new: *const (),
                _old: *const (),
            }

            #[used]
            #[allow(non_upper_case_globals)]
            #[unsafe(link_section="__DATA,__interpose")]
            pub static mut $c_api: $c_api = $c_api {
                _new: super::$real_api as *const (),
                _old: super::$c_api as *const (),
            };
        }

        unsafe extern "C" {
            pub fn $c_api ( $($param_name : $param_type),* ) -> $return_type;
        }

        pub unsafe extern "C" fn $real_api ( $($param_name : $param_type),* ) -> $return_type {
            ::std::panic::catch_unwind(|| unsafe {
                let $real_api = $c_api;
				$override_body
			}).unwrap_or_else(|_| unsafe { $real_api ( $($param_name),* ) })
        }
    };

    (unsafe fn $c_api:ident/$real_api:ident ( $($param_name:ident : $param_type:ty),* ) $override_body:block) => {
        extern_c_overrides! { unsafe fn $c_api/$real_api ( $($param_name : $param_type),* ) -> () $override_body }
    };
}
