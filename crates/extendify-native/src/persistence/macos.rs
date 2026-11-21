use std::{env::home_dir, ffi::{CStr, c_void}, mem::transmute};
use anyhow::{Result, ensure};
use common::inject::{Injector, InjectorBackend};
use objc2::{ffi::{class_addMethod, class_getClassMethod, method_exchangeImplementations, method_getTypeEncoding, objc_getClass, objc_getMetaClass}, msg_send, runtime::{AnyObject, Bool, Imp, Sel}, sel};

use crate::{log, persistence::util::NotNull};

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

// https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html
const TYPE_ENCODING: &str = "B28@0:8r^v16B24";

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

		let original_method = class_getClassMethod(class, original_selector)
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

		let swizzled_method = class_getClassMethod(class, swizzled_selector);

		method_exchangeImplementations(original_method.cast_mut(), swizzled_method.cast_mut());
	}

	Ok(())
}

fn patch_macho() {
	let app_support = home_dir().unwrap().join("Library/Application Support");
	let path = app_support.join("Spotify/PersistentCache/Update/temp/Spotify.app");

	if !path.exists() { return; }

	log("Patching Spotify update");

	if let Err(err) = Injector::new(path).inject() {
		log(err.context("Failed to patch update"));
	} else {
		log("Patched Spotify update");
	}
}
