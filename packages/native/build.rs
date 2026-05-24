use std::env;
use std::path::PathBuf;

fn main() {
    let cef_path = env::var("CEF_PATH").unwrap_or_else(|_| {
        let manifest_dir = env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        format!("{}/cef", manifest_dir)
    });

    println!("cargo:rustc-link-search=native={}/Release", cef_path);
    #[cfg(target_os = "windows")]
    println!("cargo:rustc-link-lib=libcef");
    #[cfg(target_os = "linux")]
    println!("cargo:rustc-link-lib=dylib=cef");

    let builder = bindgen::Builder::default()
        .header("wrapper.h")
        .clang_arg(format!("-I{}", cef_path))
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .default_enum_style(bindgen::EnumVariation::Rust {
            non_exhaustive: true,
        })
        .layout_tests(false)
        .wrap_unsafe_ops(true)
        .default_macro_constant_type(bindgen::MacroTypeVariation::Signed)
        .allowlist_type("_cef_settings_t")
        .allowlist_type("_cef_app_t")
        .allowlist_type("_cef_main_args_t")
        .allowlist_type("_cef_browser_view_delegate_t");

    let bindings = builder.generate().expect("Unable to generate bindings");

    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings");
}
