use std::path::PathBuf;
use anyhow::{Context, Result, ensure};
use bpaf::Bpaf;
use common::{consts, inject::{Injector, InjectorBackend}, log::Logger, update};
use log::{LevelFilter, info, warn};
use owo_colors::OwoColorize;

fn spotify_path(path: Option<PathBuf>) -> Result<PathBuf> {
	let path = path.or(consts::paths::spotify_path())
		.context("No app path specified and unable to infer Spotify path")?;

	ensure!(path.exists(), "No Spotify install found at: {}", path.display());

	Ok(path)
}

#[derive(Debug, Clone, Bpaf)]
struct CommonOptions {
	/// Path to the Spotify app. If omitted, defaults to a typical install location.
	#[bpaf(long, argument::<PathBuf>("PATH"), optional, parse(spotify_path))]
	app: PathBuf,
}

#[derive(Debug, Clone, Bpaf)]
enum Command {
	/// Install/update and inject Extendify
	#[bpaf(command)]
    Install {
		#[bpaf(external(common_options))]
		common: CommonOptions,
    },
	/// Update Extendify
	#[bpaf(command)]
    Update {},
	/// Inject Extendify
	#[bpaf(command)]
    Inject {
		#[bpaf(external(common_options))]
		common: CommonOptions,
    },
	/// Uninject Extendify
	#[bpaf(command)]
    Uninject {
		#[bpaf(external(common_options))]
		common: CommonOptions,
    },
	/// Get information about the state of the Extendify install
	#[bpaf(command)]
    Status {
		#[bpaf(external(common_options))]
		common: CommonOptions,

		/// Whether to skip update checks
		#[bpaf(flag(true, false))]
		offline: bool,
    },
}

/// CLI to manage Extendify
#[derive(Debug, Clone, Bpaf)]
#[bpaf(options)]
struct Options {
	/// Enables debug logging. Use twice to enable debug logging for external crates.
	#[bpaf(short, req_flag(()), count, map(|x| x.clamp(0, 2)))]
    verbose: usize,

	#[bpaf(external)]
    command: Command,
}

fn main() -> Result<()> {
	let options = options().run();
	let logger = Logger::build()
		.level(LevelFilter::Info)
		.target_level("goblin", LevelFilter::Warn)
		.target_level("apple_codesign", LevelFilter::Warn)
		.target_level("reqwest", LevelFilter::Warn);
	let logger = match options.verbose {
		1 => logger.level(LevelFilter::Debug),
		2 => logger
			.level(LevelFilter::Debug)
			.target_level("goblin", LevelFilter::Debug)
			.target_level("apple_codesign", LevelFilter::Debug)
			.target_level("reqwest", LevelFilter::Debug),
		_ => logger,
	};
	logger.init();

	match options.command {
        Command::Install { common } => {
			if update::downloaded()? {
				info!("Updating Extendify");
			} else {
				info!("Downloading Extendify");
			}
			if !update::update()? {
				info!("Extendify already on latest version");
			}

			info!("Injecting Extendify");
			if Injector::new(common.app).inject()? {
				info!("Injected Extendify");
			} else {
				info!("Extendify already injected");
			}

			info!("Extendify successfully installed!");
        },
        Command::Update {} => {
			if update::update()? {
				info!("Updated Extendify");
			} else {
				info!("Extendify already on latest version");
			}
        },
        Command::Inject { common } => {
			if Injector::new(common.app.clone()).inject()? {
				info!("Injected Extendify");
				info!("Restart Spotify to apply changes");
			} else {
				info!("Extendify already injected");
			}
        },
        Command::Uninject { common } => {
			if Injector::new(common.app.clone()).uninject()? {
				info!("Uninjected Extendify");
				info!("Restart Spotify to apply changes");
				warn!("Note: This does not remove the Extendify directories");
			} else {
				info!("Extendify already uninjected");
			}
        },
        Command::Status { common, offline } => {
			let injector = Injector::new(common.app.clone());
			let injected = injector.is_injected()?;

			fn fmt_bool<'a>(bool: bool) -> String {
				if bool { "true".green().bold().to_string() }
				else { "false".red().bold().to_string() }
			}

			info!("Spotify Path: {}", common.app.display());
			info!("Extendify Path: {}", consts::paths::extendify_data().display());
			info!("Extendify Injected: {}", fmt_bool(injected));
			info!("Extendify Downloaded: {}", fmt_bool(update::downloaded()?));
			if !offline {
				info!("Checking for updates...");
				info!("Extendify Updates Available: {}", fmt_bool(update::has_updates()?));
			}
        }
    }

	Ok(())
}
