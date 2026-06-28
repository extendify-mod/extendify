use crate::config::Config;
use tokio::time;

mod cache;
mod config;
mod constants;

#[tokio::main]
async fn main() {
    let config = Config::read();

    let mut interval = time::interval(time::Duration::from_mins(10));

    loop {
        interval.tick().await;

        if let Err(e) = run(&config).await {
            eprintln!("Crash: {e}")
        }
    }
}

async fn run(config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}
