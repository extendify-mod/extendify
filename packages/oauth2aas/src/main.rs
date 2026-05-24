use gpapi::Gpapi;
use std::env;

#[tokio::main]
async fn main() {
    let args: Vec<_> = env::args().collect();

    let email = args.get(1).expect("Missing email");
    let oauth2 = args.get(2).expect("Missing oauth2 token");

    let mut api = Gpapi::new("px_9_fold", email);
    println!("{:?}", api.request_aas_token(oauth2).await);
    println!("{:?}", api.get_aas_token().unwrap());
}
