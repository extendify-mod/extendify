use anyhow::{Context, Result, ensure};
use goblin::elf64::{
	dynamic::{DT_NEEDED, DT_NULL, DT_STRSZ, DT_STRTAB, Dyn, SIZEOF_DYN},
	header::{
		EI_CLASS, EI_DATA, ELFCLASS64, ELFDATA2LSB, EM_X86_64, ET_DYN, ET_EXEC, Header, SIZEOF_EHDR,
	},
	program_header::{PF_R, PF_W, PT_DYNAMIC, PT_LOAD, PT_PHDR, ProgramHeader, SIZEOF_PHDR},
	section_header::{SHT_DYNAMIC, SHT_STRTAB, SIZEOF_SHDR, SectionHeader},
};
use scroll::{LE, Pread, Pwrite};
use std::ops::Range;

pub struct Elf<'a> {
	data: &'a [u8],
	header: Header,
	programs: Vec<ProgramHeader>,
	sections: Vec<SectionHeader>,
	dynamic_index: usize,
	entries: Vec<Dyn>,
	strings: &'a [u8],
	strtab_addr: u64,
}

impl<'a> Elf<'a> {
	pub fn parse(data: &'a [u8]) -> Result<Self> {
		let header: Header = data.pread_with(0, LE).context("Invalid ELF header")?;
		ensure!(&header.e_ident[..4] == b"\x7fELF", "Not an ELF binary");
		ensure!(
			header.e_ident[EI_CLASS] == ELFCLASS64
				&& header.e_ident[EI_DATA] == ELFDATA2LSB
				&& header.e_machine == EM_X86_64
				&& matches!(header.e_type, ET_EXEC | ET_DYN),
			"Linux injection requires a little-endian x86-64 ELF executable"
		);
		ensure!(
			header.e_ehsize as usize == SIZEOF_EHDR
				&& header.e_phentsize as usize == SIZEOF_PHDR
				&& header.e_phnum != u16::MAX,
			"Unsupported ELF program header table"
		);
		let mut offset = usize::try_from(header.e_phoff)?;
		let programs: Vec<ProgramHeader> = (0..header.e_phnum)
			.map(|_| data.gread_with(&mut offset, LE))
			.collect::<std::result::Result<_, _>>()?;
		for program in &programs {
			if program.p_type == PT_LOAD {
				ensure!(
					program.p_filesz <= program.p_memsz,
					"Invalid ELF load segment"
				);
				file_range(program.p_offset, program.p_filesz, data.len())?;
				program
					.p_vaddr
					.checked_add(program.p_memsz)
					.context("ELF load address overflow")?;
			}
		}
		let mut dynamics = programs
			.iter()
			.enumerate()
			.filter(|(_, program)| program.p_type == PT_DYNAMIC);
		let (dynamic_index, dynamic) = dynamics.next().context("Missing ELF dynamic segment")?;
		ensure!(
			dynamics.next().is_none(),
			"Multiple ELF dynamic segments are not supported"
		);
		ensure!(
			dynamic.p_filesz.is_multiple_of(SIZEOF_DYN as u64),
			"Invalid ELF dynamic segment size"
		);
		let dynamic_range = file_range(dynamic.p_offset, dynamic.p_filesz, data.len())?;
		ensure!(
			mapped_range(&programs, dynamic.p_vaddr, dynamic.p_filesz, data.len())?
				== dynamic_range,
			"ELF dynamic segment is not file-backed at its declared address"
		);
		let mut entries = Vec::new();
		let mut offset = dynamic_range.start;
		let mut terminated = false;
		while offset < dynamic_range.end {
			let entry: Dyn = data.gread_with(&mut offset, LE)?;
			if entry.d_tag == DT_NULL {
				terminated = true;
				break;
			}
			entries.push(entry);
		}
		ensure!(terminated, "Unterminated ELF dynamic table");
		let strtab_addr = entries
			.iter()
			.find(|entry| entry.d_tag == DT_STRTAB)
			.context("Missing ELF string table")?
			.d_val;
		let strtab_size = entries
			.iter()
			.find(|entry| entry.d_tag == DT_STRSZ)
			.context("Missing ELF string table size")?
			.d_val;
		let strings = &data[mapped_range(&programs, strtab_addr, strtab_size, data.len())?];
		ensure!(
			strings.first() == Some(&0) && strings.last() == Some(&0),
			"Invalid ELF string table"
		);

		ensure!(
			header.e_shnum != 0 || header.e_shoff == 0,
			"Extended ELF section counts are not supported"
		);
		ensure!(
			header.e_shnum == 0 || header.e_shentsize as usize == SIZEOF_SHDR,
			"Unsupported ELF section header table"
		);
		let mut offset = usize::try_from(header.e_shoff)?;
		let sections = (0..header.e_shnum)
			.map(|_| data.gread_with(&mut offset, LE))
			.collect::<std::result::Result<_, _>>()?;
		Ok(Self {
			data,
			header,
			programs,
			sections,
			dynamic_index,
			entries,
			strings,
			strtab_addr,
		})
	}

	fn string(&self, offset: u64) -> Result<&[u8]> {
		let bytes = self
			.strings
			.get(usize::try_from(offset)?..)
			.context("ELF string offset out of bounds")?;
		let end = bytes
			.iter()
			.position(|byte| *byte == 0)
			.context("Unterminated ELF string")?;
		Ok(&bytes[..end])
	}

	pub fn has_needed(&self, name: &str) -> Result<bool> {
		let mut found = false;
		for entry in &self.entries {
			if entry.d_tag == DT_NEEDED {
				found |= self.string(entry.d_val)? == name.as_bytes();
			}
		}
		Ok(found)
	}

	pub fn with_needed(&self, name: &str, add: bool) -> Result<Vec<u8>> {
		let name = name.as_bytes();
		let mut strings = self.strings.to_vec();
		let mut entries = Vec::new();
		if add {
			let mut offset = 0;
			let existing = self.strings.split(|byte| *byte == 0).find_map(|string| {
				let current = offset;
				offset += string.len() + 1;
				(string == name).then_some(current)
			});
			let offset = existing.unwrap_or_else(|| {
				let offset = strings.len();
				strings.extend_from_slice(name);
				strings.push(0);
				offset
			});
			// Extendify must interpose CEF before libcef's own definitions are searched.
			entries.push(Dyn {
				d_tag: DT_NEEDED,
				d_val: offset as u64,
			});
		}
		for entry in &self.entries {
			if !add && entry.d_tag == DT_NEEDED && self.string(entry.d_val)? == name {
				continue;
			}
			entries.push(*entry);
		}
		entries.push(Dyn {
			d_tag: DT_NULL,
			d_val: 0,
		});
		let mut output = self.data.to_vec();
		let dynamic = &self.programs[self.dynamic_index];
		let dynamic_size = (entries.len() * SIZEOF_DYN) as u64;
		// Keep the strings and spare dynamic slots on removal, so reinstalling does not grow the file.
		if strings.len() == self.strings.len() && dynamic_size <= dynamic.p_filesz {
			write_dynamic(&mut output, dynamic.p_offset, dynamic.p_filesz, &entries)?;
			return Ok(output);
		}

		let mut programs = self.programs.clone();
		if !programs.iter().any(|program| program.p_type == PT_PHDR) {
			programs.insert(
				0,
				ProgramHeader {
					p_type: PT_PHDR,
					..ProgramHeader::default()
				},
			);
		}
		let phnum = u16::try_from(programs.len() + 1).context("Too many ELF program headers")?;
		ensure!(
			phnum != u16::MAX,
			"Extended ELF program counts are not supported"
		);
		let phdr_size = u64::from(phnum) * SIZEOF_PHDR as u64;
		let file_offset = (output.len() as u64)
			.checked_next_multiple_of(4096)
			.context("ELF file offset overflow")?;
		// Start after p_memsz, not p_filesz: the intervening .bss must remain zero-filled.
		let memory_end = programs
			.iter()
			.filter(|program| program.p_type == PT_LOAD)
			.map(|program| program.p_vaddr + program.p_memsz)
			.max()
			.context("Missing ELF load segments")?;
		let address = memory_end
			.checked_next_multiple_of(4096)
			.context("ELF load address overflow")?;
		let dynamic_offset = file_offset
			.checked_add(phdr_size)
			.context("ELF file offset overflow")?;
		let strings_offset = dynamic_offset
			.checked_add(dynamic_size)
			.context("ELF file offset overflow")?;
		let size = phdr_size + dynamic_size + strings.len() as u64;
		let dynamic_address = address
			.checked_add(phdr_size)
			.context("ELF load address overflow")?;
		let strings_address = dynamic_address
			.checked_add(dynamic_size)
			.context("ELF load address overflow")?;
		address
			.checked_add(size)
			.context("ELF load address overflow")?;
		programs.push(ProgramHeader {
			p_type: PT_LOAD,
			p_flags: PF_R | PF_W,
			p_offset: file_offset,
			p_vaddr: address,
			p_paddr: address,
			p_filesz: size,
			p_memsz: size,
			p_align: 4096,
		});
		for program in &mut programs {
			match program.p_type {
				PT_PHDR => {
					program.p_offset = file_offset;
					program.p_vaddr = address;
					program.p_paddr = address;
					program.p_filesz = phdr_size;
					program.p_memsz = phdr_size;
					program.p_flags = PF_R;
					program.p_align = 8;
				}
				PT_DYNAMIC => {
					program.p_offset = dynamic_offset;
					program.p_vaddr = dynamic_address;
					program.p_paddr = dynamic_address;
					program.p_filesz = dynamic_size;
					program.p_memsz = dynamic_size;
					program.p_flags = PF_R | PF_W;
					program.p_align = 8;
				}
				_ => {}
			}
		}
		for entry in &mut entries {
			match entry.d_tag {
				DT_STRTAB => entry.d_val = strings_address,
				DT_STRSZ => entry.d_val = strings.len() as u64,
				_ => {}
			}
		}
		let mut header = self.header;
		header.e_phoff = file_offset;
		header.e_phnum = phnum;
		let end = file_offset
			.checked_add(size)
			.context("ELF file offset overflow")?;
		output.resize(usize::try_from(end)?, 0);
		output.pwrite_with(header, 0, LE)?;
		let mut offset = usize::try_from(file_offset)?;
		for program in programs {
			output.gwrite_with(program, &mut offset, LE)?;
		}
		write_dynamic(&mut output, dynamic_offset, dynamic_size, &entries)?;
		output[usize::try_from(strings_offset)?..].copy_from_slice(&strings);
		let mut offset = usize::try_from(header.e_shoff)?;
		for mut section in self.sections.iter().copied() {
			if section.sh_type == SHT_DYNAMIC && section.sh_addr == dynamic.p_vaddr {
				section.sh_offset = dynamic_offset;
				section.sh_addr = dynamic_address;
				section.sh_size = dynamic_size;
			} else if section.sh_type == SHT_STRTAB && section.sh_addr == self.strtab_addr {
				section.sh_offset = strings_offset;
				section.sh_addr = strings_address;
				section.sh_size = strings.len() as u64;
			}
			output.gwrite_with(section, &mut offset, LE)?;
		}
		Ok(output)
	}
}

fn file_range(offset: u64, size: u64, len: usize) -> Result<Range<usize>> {
	let start = usize::try_from(offset)?;
	let end = start
		.checked_add(usize::try_from(size)?)
		.context("ELF file range overflow")?;
	ensure!(end <= len, "ELF file range out of bounds");
	Ok(start..end)
}

fn mapped_range(
	programs: &[ProgramHeader],
	address: u64,
	size: u64,
	len: usize,
) -> Result<Range<usize>> {
	for program in programs.iter().filter(|program| program.p_type == PT_LOAD) {
		if let Some(offset) = address.checked_sub(program.p_vaddr)
			&& offset <= program.p_filesz
			&& size <= program.p_filesz - offset
		{
			let offset = program
				.p_offset
				.checked_add(offset)
				.context("ELF file offset overflow")?;
			return file_range(offset, size, len);
		}
	}
	anyhow::bail!("ELF address is not in a file-backed load segment")
}

fn write_dynamic(output: &mut [u8], offset: u64, size: u64, entries: &[Dyn]) -> Result<()> {
	let range = file_range(offset, size, output.len())?;
	let bytes = &mut output[range];
	bytes.fill(0);
	let mut offset = 0;
	for entry in entries {
		bytes.gwrite_with(*entry, &mut offset, LE)?;
	}
	Ok(())
}
