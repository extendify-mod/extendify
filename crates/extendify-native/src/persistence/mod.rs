use ctor::ctor;

#[cfg(target_os = "macos")]
mod macos;

#[ctor(unsafe)]
fn main() {
	#[cfg(target_os = "macos")]
	macos::swizzle();
}
