# Nitocris Gallery

A gallery application that fetches and displays images of **Nitocris** from Fate/Grand Order using multiple public image board APIs.

## Features

- Multi-source image fetching: **Safebooru**, **Xbooru**, and Google Images (fallback)
- All sources queried **in parallel** — results are combined and deduplicated
- Built-in **image proxy** that bypasses CDN hotlink protection by forwarding requests server-side with the correct `Referer` header
- In-memory cache with configurable TTL to avoid redundant API calls
- Custom vanilla JS lightbox (no jQuery, no CDN dependency)
- Responsive grid gallery with keyboard navigation (← → Esc)
- Security headers via Helmet, HTTP logging via Morgan, response compression via Compression

## Image Sources

| Source | Type | Notes |
|--------|------|-------|
| [Safebooru](https://safebooru.org) | SFW | ~100 posts via `nitocris_(fate)` tag |
| [Xbooru](https://xbooru.com) | NSFW | ~24 posts via `nitocris_(fate)` tag |
| Google Images | Fallback | Scraping — unreliable, used only if both above fail |

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port Express listens on |
| `SEARCH_URL` | Google Images URL | Custom URL for the Google Images fallback |
| `CACHE_TTL_MS` | `300000` | Image cache lifetime in milliseconds (5 minutes) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier |

## Testing

Unit tests cover the `getNitocrisImages` function in [src/lib/images.js](src/lib/images.js) using **Jest** with axios mocked:

```bash
npm test
# or with coverage
npm run test:coverage
```

Test cases:
- Returns combined, shuffled images from all working sources
- Uses the correct `thumb`/`full` URL fields for each source
- Caches results — no duplicate API calls within the TTL window
- Deduplicates images that share the same `full` URL across sources
- Gracefully handles partial source failures
- Throws a descriptive error when all sources fail
- Filters out GIFs and non-image file types

## Tech Stack

- **Express** — web framework
- **EJS** — server-side templating
- **Axios** — HTTP client for API requests and image proxy
- **Cheerio** — HTML parsing for the Google Images fallback
- **Helmet** — security HTTP headers
- **Morgan** — HTTP request logging
- **Compression** — gzip response compression
- **Dotenv** — environment variable management
- **ESLint + Prettier** — code quality and formatting
- **Nodemon** — development auto-reload

## Character

Nitocris is a Servant from the mobile game **Fate/Grand Order** by TYPE-MOON.
All images are sourced from public image boards and belong to their respective artists.


<img width="1462" height="1083" alt="image" src="https://github.com/user-attachments/assets/6c80079d-c210-425e-8eb2-e89915259a9a" />

## Libraries used

- Prettier: code formatter
- ESLint: linter
- Cheerio: HTML parsing library
- Axios: HTTP client
- Dotenv: environment variable management
- EJS: template engine
- Express: web framework
- Nodemon: development server

### Prettier

Prettier is a code formatter that ensures consistent code style across your project.

### ESLint

ESLint is a linter that identifies and reports on patterns found in your code.

### Cheerio

Cheerio is a fast and simple HTML parsing library that lets you traverse the HTML DOM using familiar jQuery syntax.

### Axios

Axios is a promise-based HTTP client for making HTTP requests from JavaScript.

### Dotenv

Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env.

### EJS

EJS is a simple templating language that lets you generate HTML markup with plain JavaScript.

### Express

Express is a fast, unopinionated, minimalist web framework for Node.js.

### Nodemon

Nodemon is a development server that automatically restarts your application when changes are made to your source code.

## Image Quality

Please note that the images returned by the Google Images API may not be of high quality, and there is no way to control the quality of the images returned by the API.

## Usage

To run the application, simply run **npm install** and **npm start**.

## Nitocris

Nitocris is a character from the popular mobile game Fate Grand Order. She is an Egyptian pharaoh who has been summoned as a Caster class Servant.

## Environment Variables

The only environment variable used by the application is PORT, which is the port that Express listens on. If no port is specified, the application will use port 3000 by default.

## Responsiveness

The website is 100% responsive, meaning it looks great on all screen sizes.

## Code Quality

The code is simple and follows the best practices of JavaScript.
