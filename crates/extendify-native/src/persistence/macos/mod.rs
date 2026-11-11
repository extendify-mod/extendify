mod macho;

use std::{env::home_dir, error::Error, ffi::c_void, fs::{self, File}, mem::transmute, path::PathBuf};
use objc2::{ffi::{class_addMethod, class_getClassMethod, method_exchangeImplementations, method_getTypeEncoding, objc_getClass, objc_getMetaClass}, msg_send, runtime::{AnyClass, Imp, Sel}, sel};

use crate::{consts, log, persistence::macos::macho::MachO};

unsafe extern "C-unwind" fn swizzled_relaunch(
	class: *mut AnyClass,
	_sel: Sel,
	available: *const c_void,
	filter_action_arguments: bool
) -> bool {
	patch_macho();

	msg_send![class,
		swizzled_relaunchForUpgradeIfAvailable:available,
		filterActionArguments:filter_action_arguments
	]
}

pub fn swizzle() {
	unsafe {
		let class = objc_getClass(c"SPTRelaunchUpgrader".as_ptr()).cast_mut();
		let metaclass = objc_getMetaClass(c"SPTRelaunchUpgrader".as_ptr()).cast_mut();

		// Note, these are class methods
		let original_selector = sel!(relaunchForUpgradeIfAvailable:filterActionArguments:);
		let swizzled_selector = sel!(swizzled_relaunchForUpgradeIfAvailable:filterActionArguments:);

		let original_method = class_getClassMethod(class, original_selector);

		let swizzled_relaunch = transmute::<
			unsafe extern "C-unwind" fn(*mut AnyClass, Sel, *const c_void, bool) -> bool,
			Imp
		>(swizzled_relaunch);

		// When swizzling a class method, we need to use the metaclass here instead
		let success = class_addMethod(metaclass, swizzled_selector, swizzled_relaunch, method_getTypeEncoding(original_method));
		assert!(success.as_bool(), "failed to add method");

		let swizzled_method = class_getClassMethod(class, swizzled_selector);

		method_exchangeImplementations(original_method.cast_mut(), swizzled_method.cast_mut());
	}
}

/// Inject extendify.dylib into a Spotify binary.
fn inject(macho_path: &PathBuf) {
	let dylib_path = consts::paths::extendify_native().into_string().unwrap();

	let macho = fs::read(macho_path).expect("Failed to read Spotify binary");
	let macho = MachO::parse(&macho);

	if macho.has_dylib(&dylib_path) { return; }

	let macho = macho.add_dylib_load_path(&dylib_path).expect("Failed to add dylib load command");

	let temp_macho_path = macho_path.with_added_extension("temp");
	let write_res = || -> Result<(), Box<dyn Error>> {
		let mut file = File::create(&temp_macho_path)?;
		file.set_permissions(macho_path.metadata()?.permissions())?;

		Ok(MachO::adhoc_sign(&macho, &mut file)?)
	}();

	match write_res {
		Ok(_) => {
			fs::rename(temp_macho_path, macho_path).expect("Failed to rename file");
		},
		Err(e) => {
			log(format!("Failed to patch Spotify binary: {e}"));
			fs::remove_file(temp_macho_path).expect("Failed to cleanup after error");
			panic!("Failed to patch Spotify binary: {e}");
		},
	}
}

fn patch_macho() {
	let app_support = home_dir().unwrap().join("Library/Application Support");
	let macho_path = app_support.join("Spotify/PersistentCache/Update/temp/Spotify.app/Contents/MacOS/Spotify");

	inject(&macho_path);

	log("Patched Spotify update");
}
