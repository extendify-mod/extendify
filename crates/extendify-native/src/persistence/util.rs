use anyhow::{Result, ensure};

#[cfg_attr(not(target_os = "macos"), allow(unused))]
pub trait NotNull: Sized {
    fn not_null(self, msg: &'static str) -> Result<Self>;
}

impl<T: ?Sized> NotNull for *mut T {
    fn not_null(self, msg: &'static str) -> Result<*mut T> {
        ensure!(!self.is_null(), msg);
        Ok(self)
    }
}
impl<T: ?Sized> NotNull for *const T {
    fn not_null(self, msg: &'static str) -> Result<*const T> {
        ensure!(!self.is_null(), msg);
        Ok(self)
    }
}
