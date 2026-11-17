mod macho;

use std::{env::home_dir, error::Error, ffi::c_void, fs::{self, File}, mem::transmute, path::PathBuf};
use anyhow::{Context, Result, anyhow, bail};
use objc2::{ffi::{class_addMethod, class_getClassMethod, method_exchangeImplementations, method_getTypeEncoding, objc_getClass, objc_getMetaClass}, msg_send, runtime::{AnyClass, AnyObject, Bool, Imp, Sel}, sel};

use crate::{consts, log, persistence::{macos::macho::MachO, util::NotNull}};

// https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html
const TYPE_ENCODING: &str = "B28@0:8r^v16B24";

unsafe extern "C-unwind" fn swizzled_relaunch(
	class: *mut AnyObject,
	_sel: Sel,
	available: *const c_void,
	filter_action_arguments: Bool
) -> Bool {
	patch_macho();

	msg_send![class,
		swizzled_relaunchForUpgradeIfAvailable:available,
		filterActionArguments:filter_action_arguments
	]
}

pub fn swizzle() -> Result<()> {
	unsafe {
		let name = c"SPTRelaunchUpgrader".as_ptr();
		let class = objc_getClass(name).cast_mut()
			.not_null("Failed to resolve SPTRelaunchUpgrader class")?;
		let metaclass = objc_getMetaClass(name).cast_mut()
			.not_null("Failed to resolve SPTRelaunchUpgrader metaclass")?;

		// Note, these are class methods
		let original_selector = sel!(relaunchForUpgradeIfAvailable:filterActionArguments:);
		let swizzled_selector = sel!(swizzled_relaunchForUpgradeIfAvailable:filterActionArguments:);

		let original_method = class_getClassMethod(class, original_selector).cast_mut()
			.not_null("Failed to resolve original method")?;

		let type_encoding = method_getTypeEncoding(original_method)
			.not_null("Failed to get original method type encoding")?;

		ensure!(
			CStr::from_ptr(type_encoding).to_str()? == TYPE_ENCODING,
			"Unexpected method type encoding. Extendify Native must be updated to fix this."
		);

		let swizzled_relaunch = transmute::<
			unsafe extern "C-unwind" fn(*mut AnyObject, Sel, *const c_void, Bool) -> Bool,
			Imp
		>(swizzled_relaunch);

		// When swizzling a class method, we need to use the metaclass here instead
		let success = class_addMethod(
			metaclass, 
			swizzled_selector, 
			swizzled_relaunch,
			type_encoding
		);
		ensure!(success.as_bool(), "Failed to add method to SPTRelaunchUpgrader");

		let swizzled_method = class_getClassMethod(class, swizzled_selector).cast_mut();

		method_exchangeImplementations(original_method, swizzled_method);
	}

	Ok(())
}

/// Inject extendify.dylib into a Spotify binary.
fn inject(macho_path: &PathBuf) -> Result<bool> {
	let dylib_path = consts::paths::extendify_native().into_string().unwrap();

	let macho = fs::read(macho_path).context("Failed to read Spotify binary")?;
	let macho = MachO::parse(&macho);

	if macho.has_dylib(&dylib_path) { return Ok(false); }

	let macho = macho.add_dylib_load_path(&dylib_path).context("Failed to add dylib load command")?;

	let temp_macho_path = macho_path.with_added_extension("temp");
	let write_res = || -> Result<()> {
		let mut file = File::create(&temp_macho_path)?;
		file.set_permissions(macho_path.metadata()?.permissions())?;

		Ok(MachO::adhoc_sign(&macho, &mut file)?)
	}();

	match write_res {
		Ok(_) => {
			fs::rename(temp_macho_path, macho_path).context("Failed to rename file")?;
			Ok(true)
		},
		Err(e) => {
			fs::remove_file(temp_macho_path).context("Failed to cleanup after error")?;
			bail!("Failed to patch Spotify binary: {e}")
		},
	}
}

fn patch_macho() {
	let app_support = home_dir().unwrap().join("Library/Application Support");
	let macho_path = app_support.join("Spotify/PersistentCache/Update/temp/Spotify.app/Contents/MacOS/Spotify");

	if !macho_path.exists() { return; }

	log("Patching Spotify update");

	match inject(&macho_path) {
		Ok(true) => {
			log("Patched Spotify update");
		},
		Ok(false) => {
			log("Spotify update already patched, skipping");
		},
		Err(_) => {
			log(err.context("Failed to patch Spotify update"));
		},
	}
}
