use std::collections::HashMap;

use chrono::Local;
use log::{Level, LevelFilter, Metadata, Record};
use owo_colors::OwoColorize;

// A logger inspired by https://github.com/charmbracelet/log
pub struct Logger {
	level: LevelFilter,
	levels: HashMap<String, LevelFilter>,
}

impl Default for Logger {
    fn default() -> Logger {
		Logger {
			level: LevelFilter::Info,
			levels: HashMap::new()
		}
	}
}

impl Logger {
	pub fn build() -> Logger {
		Logger::default()
	}

	/// Set the global log level
	pub fn level(mut self, level: LevelFilter) -> Logger {
		self.level = level;
		self
	}

	/// Set the log level for a certain target (based on prefix)
	pub fn target_level<T: Into<String>>(mut self, target: T, level: LevelFilter) -> Logger {
		self.levels.insert(target.into(), level);
		self
	}

	fn max_level(&self) -> LevelFilter {
		let highest = self.levels.iter()
			.map(|f| f.1)
			.max()
			.copied()
			.unwrap_or(self.level);
		self.level.max(highest)
	}

	fn level_for_target(&self, target: &str) -> LevelFilter {
		self.levels.iter()
			.filter(|level| target.starts_with(level.0))
			.max_by_key(|level| level.0.len())
			.map_or(self.level, |level| *level.1)
	}

	pub fn init(self) {
		let logger = Box::new(self);
		log::set_max_level(logger.max_level());
		log::set_boxed_logger(logger).expect("Failed to initialize logger");
	}
}

impl log::Log for Logger {
    fn enabled(&self, metadata: &Metadata) -> bool {
		metadata.level() <= self.level_for_target(metadata.target())
    }

    fn log(&self, record: &Record) {
        if self.enabled(record.metadata()) {
			let level = match record.level() {
				Level::Error => "ERRO".red().into_styled(),
				Level::Warn => "WARN".yellow().into_styled(),
				Level::Info => "INFO".cyan().into_styled(),
				Level::Debug => "DEBU".blue().into_styled(),
				Level::Trace => "TRAC".purple().into_styled(),
			};
			let level = level.bold();

			let time = Local::now().format("%H:%M:%S");
			let time = time.dimmed();

            println!("{time} {level} {} {}", record.target().bold().dimmed(), record.args());
        }
    }

    fn flush(&self) {}
}

pub fn init() {
	Logger::build().init();
}
