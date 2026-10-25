use std::os::windows::ffi::OsStrExt;
use std::sync::OnceLock;
use windows_sys::{
    Win32::{
        Foundation::HMODULE,
        System::{
            LibraryLoader::{GetProcAddress, LoadLibraryW},
            SystemInformation::GetSystemDirectoryW,
        },
    },
    core::HRESULT,
};

fn load_dll_from_system32(dll: &str) -> HMODULE {
    assert!(
        !dll.is_empty() && !dll.contains(['\\', '/', ':']) && !dll.contains('\0'),
        "DLL name must be a filename, not a path"
    );

    let mut dir = [0u16; 32_768];
    let len = unsafe { GetSystemDirectoryW(dir.as_mut_ptr(), dir.len() as u32) };

    assert!(
        len > 0 && (len as usize) < dir.len(),
        "GetSystemDirectoryW failed or the path was too long"
    );

    let mut path = dir[..len as usize].to_vec();
    path.push(b'\\' as u16);
    path.extend(std::ffi::OsStr::new(dll).encode_wide());
    path.push(0);

    let module = unsafe { LoadLibraryW(path.as_ptr()) };
    assert!(!module.is_null(), "Failed to load DLL from System32");

    module
}

macro_rules! forward_function {
    (
        $dll:literal,
        $name:ident(
            $($arg:ident : $arg_ty:ty),* $(,)?
        ) -> $ret:ty
    ) => {
        #[unsafe(no_mangle)]
        pub unsafe extern "system" fn $name(
            $($arg: $arg_ty),*
        ) -> $ret {
            type ForwardedFn =
                unsafe extern "system" fn($($arg_ty),*) -> $ret;

            static TARGET: OnceLock<ForwardedFn> =
                OnceLock::new();

            let target = *TARGET.get_or_init(|| {
                let module = load_dll_from_system32($dll);

                let symbol = concat!(stringify!($name), "\0");
                let proc = unsafe { GetProcAddress(module, symbol.as_ptr()) };

                let proc = proc.expect(concat!(
                    "Forwarded export not found: ",
                    stringify!($name)
                ));

                unsafe {
                    std::mem::transmute::<
                        unsafe extern "system" fn() -> isize,
                        ForwardedFn,
                    >(proc)
                }
            });

            unsafe { target($($arg),*) }
        }
    };
}

forward_function!(
    "dwrite.dll",
    DWriteCreateFactory(
        factory_type: i32,
        iid: *const windows_sys::core::GUID,
        factory: *mut *mut std::ffi::c_void,
    ) -> HRESULT
);
