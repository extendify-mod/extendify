#[cfg(target_os = "macos")]
mod macos;

mod util;

pub fn init() {
	#[cfg(target_os = "macos")]
	{
		if let Err(e) = macos::swizzle() {
			crate::log(e);
		}
	}
}
