# App Store Scraper Bot

A Node.js-based scraping tool and API that analyzes company websites to detect and extract information about their mobile applications from both the Google Play Store and Apple App Store.

## Features

- Website analysis for app store presence
- Google Play Store metadata extraction
- Apple App Store metadata extraction
- Fallback company information gathering
- Rate limiting and proxy support
- Concurrent URL processing
- User agent rotation
- RESTful API
- CSV export

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd app-store-scraper-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`

## Usage

### API Server

Start the API server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### API Endpoints

#### Health Check
```
GET /health
```

#### Scrape URLs
```
POST /scrape
Content-Type: application/json

{
    "urls": [
        "https://example1.com",
        "https://example2.com"
    ]
}
```

Response format:
```json
{
    "success": true,
    "results": [
        {
            "company": "Example Inc.",
            "url": "https://example.com",
            "app_present": true,
            "google_play_data": {
                "link": "https://play.google.com/store/apps/details?id=com.example",
                "downloads": "1M+",
                "last_updated": "2024-01-01",
                "developer_email": "support@example.com"
            },
            "app_store_data": {
                "link": "https://apps.apple.com/app/example-app/id123456789",
                "last_updated": "2024-01-01",
                "developer_email": "support@example.com"
            },
            "fallback_data": null
        }
    ]
}
```

### Command Line Interface

You can still use the CLI version:
```bash
npm run scrape-cli
```

## Rate Limiting

The API includes built-in rate limiting:
- 100 requests per IP per 15 minutes
- Maximum 10 URLs per request
- 2-second delay between batches
- 3 concurrent URL processing

## Error Handling

- Invalid URLs are rejected with 400 status
- Rate limit exceeded returns 429 status
- Server errors return 500 status
- All errors include descriptive messages

## License

MIT 