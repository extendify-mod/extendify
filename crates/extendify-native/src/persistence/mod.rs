use ctor::ctor;

mod util;

#[cfg(target_os = "macos")]
mod macos;

#[ctor(unsafe)]
fn main() {
	#[cfg(target_os = "macos")]
	if let Err(e) = macos::swizzle() {
		crate::log(e);
	}
}
