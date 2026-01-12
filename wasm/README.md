# discourse-api

Rust client library for the Discourse API.

## Features

- Fetch latest topics
- Get categories
- Get topic details with posts
- Get individual posts
- Filter topics by category
- Async/await support with tokio
- Optional authentication with API keys

## Installation

```toml
[dependencies]
discourse-api = "0.20251116"
```

## Usage

### Basic (unauthenticated)

```rust
use discourse_api::DiscourseClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = DiscourseClient::new("https://meta.discourse.org");

    let topics = client.get_latest().await?;

    for topic in topics.topics {
        println!("{}", topic.title);
    }

    Ok(())
}
```

### With API Authentication

```rust
let client = DiscourseClient::with_api_key(
    "https://your-forum.com",
    "your-api-key",
    "your-username"
);

let topics = client.get_latest().await?;
```

## Examples

Run the example:

```bash
cargo run --example fetch_latest
```

## API Endpoints

- `get_latest()` - Get latest topics
- `get_categories()` - Get all categories
- `get_topic(id)` - Get topic with posts
- `get_post(id)` - Get individual post
- `get_category_topics(category_id)` - Get topics in category

## License

MIT
