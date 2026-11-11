// Certain logic adapted from
// https://github.com/claration/impactor/blob/b13d99559febd63e3710dfdd0ef8cdd78d10ae13/crates/plume_core/src/utils/macho.rs

use std::{error::Error, io::Write};

use apple_codesign::{AppleCodesignError, CodeSignatureFlags, MachOSigner, SettingsScope, SigningSettings};
use goblin::mach::{MachO as GoblinMachO, cputype::CPU_TYPE_ARM64, load_command::{CommandVariant, LC_LOAD_WEAK_DYLIB}};

pub struct MachO<'a> {
	macho: GoblinMachO<'a>,
	data: &'a [u8]
}

impl MachO<'_> {
	pub fn parse<'a>(data: &'a Vec<u8>) -> MachO<'a> {
		let macho = GoblinMachO::parse(data, 0).unwrap();
		return MachO { macho, data }
	}

	pub fn has_dylib(&self, path: &str) -> bool {
		self.macho.load_commands.iter().any(|load_cmd| {
			if let CommandVariant::LoadDylib(dylib) = &load_cmd.command {
				let name_offset = load_cmd.offset + dylib.dylib.name as usize;
				let mut name_end = name_offset;

				while self.data[name_end] != 0 {
					name_end += 1;
				}

				let name = str::from_utf8(&self.data[name_offset..name_end]).unwrap();

				return name == path;
			}

			false
		})
	}

	pub fn add_dylib_load_path<'a>(&self, path: &str) -> Result<Vec<u8>, Box<dyn Error>> {
		let read_u32_le = |data: &[u8], offset: usize| -> u32 {
			u32::from_le_bytes([
				data[offset],
				data[offset + 1],
				data[offset + 2],
				data[offset + 3],
			])
		};

		let is_64 = self.macho.header.cputype == CPU_TYPE_ARM64;
		let dylib_exists = self.has_dylib(path);
		let current_sizeofcmds = read_u32_le(&self.data, 20);
		let current_ncmds = read_u32_le(&self.data, 16);

		// Create a mutable Vec<u8> so we can modify the Mach-O data in place
		let mut data = self.data.to_vec();

		// with macho.data we can clone, modify, then set the data
		// for our modified binary, then using MachO struct we can make our universal bin

		if dylib_exists {
			return Err("Dylib already exists in binary")?;
		}

		let header_size = if is_64 { 32 } else { 28 };

		// Calculate new load command size (must be 8-byte aligned)
		let dylib_path_len = path.len();
		let padding = (8 - ((dylib_path_len + 1) % 8)) % 8; // +1 for null terminator
		let dylib_command_size = 24 + dylib_path_len + 1 + padding; // sizeof(dylib_command) = 24

		// Find the position to insert the new load command
		let header_offset = 0;
		let load_commands_offset = header_offset + header_size;
		let sizeofcmds_offset = header_offset + 20;
		let ncmds_offset = header_offset + 16;

		// Find the minimum non-zero file offset from segments
		let min_fileoff = self.macho
			.load_commands
			.iter()
			.filter_map(|load_cmd| match &load_cmd.command {
				CommandVariant::Segment64(seg) if seg.filesize > 0 && seg.fileoff > 0 => {
					Some(seg.fileoff)
				}
				CommandVariant::Segment32(seg) if seg.filesize > 0 && seg.fileoff > 0 => {
					Some(seg.fileoff as u64)
				}
				_ => None,
			})
			.min()
			.unwrap_or(u64::MAX);

		// Calculate available space
		let load_commands_end = load_commands_offset + current_sizeofcmds as usize;
		let data_start = if min_fileoff < u64::MAX {
			min_fileoff as usize
		} else {
			data.len()
		};

		let available_space = data_start.saturating_sub(load_commands_end);

		if dylib_command_size > available_space {
			return Err("Not enough space in binary to add dylib load command")?;
		}

		// Write the new load command into the available space (no splice needed!)
		let insert_offset = load_commands_end;
		let mut new_command = Vec::new();
		new_command.extend_from_slice(&(LC_LOAD_WEAK_DYLIB as u32).to_le_bytes()); // cmd
		new_command.extend_from_slice(&(dylib_command_size as u32).to_le_bytes()); // cmdsize

		// dylib_command structure:
		// struct dylib {
		//     uint32_t name;          // offset from start of load command to start of name string
		//     uint32_t timestamp;     // date/time stamp
		//     uint32_t current_version;
		//     uint32_t compatibility_version;
		// };
		new_command.extend_from_slice(&24u32.to_le_bytes()); // name.offset (sizeof dylib_command header = 8 + 16 = 24)
		new_command.extend_from_slice(&2u32.to_le_bytes()); // timestamp
		new_command.extend_from_slice(&0x00010000u32.to_le_bytes()); // current_version (1.0.0)
		new_command.extend_from_slice(&0x00010000u32.to_le_bytes()); // compatibility_version (1.0.0)
		new_command.extend_from_slice(path.as_bytes());
		new_command.push(0); // null terminator
		new_command.extend(vec![0u8; padding]); // padding

		// Write directly into the existing padding space
		data[insert_offset..insert_offset + dylib_command_size].copy_from_slice(&new_command);

		// Update header fields
		let new_sizeofcmds = current_sizeofcmds + dylib_command_size as u32;
		let new_ncmds = current_ncmds + 1;

		data[sizeofcmds_offset..sizeofcmds_offset + 4]
			.copy_from_slice(&new_sizeofcmds.to_le_bytes());
		data[ncmds_offset..ncmds_offset + 4].copy_from_slice(&new_ncmds.to_le_bytes());

		Ok(data)
	}

	pub fn adhoc_sign(data: &[u8], writer: &mut impl Write) -> Result<(), AppleCodesignError> {
		let signer = MachOSigner::new(data).unwrap();
		let mut settings = SigningSettings::default();
		settings.import_settings_from_macho(data).unwrap();
		settings.remove_code_signature_flags(SettingsScope::Main, CodeSignatureFlags::RUNTIME);

		signer.write_signed_binary(&settings, writer)
	}
}
