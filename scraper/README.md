````md
# ZiroTube Media Scraper

A simple Node.js scraper built for the **ZiroTube** project.

It automatically detects whether a page is a **movie** or a **series**, extracts the required media information, and generates SQL files ready to import into Supabase.

The scraper is designed to work with:

- https://cartoony.net/
- https://carateen.tv/

## Features

- Automatic movie/series detection
- Extracts HLS video URLs
- Downloads posters and thumbnails
- Generates Supabase SQL
- Supports multi-episode series
- Skips duplicate titles
- Headless or visible browser mode

## Requirements

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Usage

Run normally:

```bash
node scraper.js
```

Run with a visible browser:

```bash
node scraper.js --visible
```

Custom delay:

```bash
node scraper.js --delay=3000
```

Custom timeout:

```bash
node scraper.js --timeout=60000
```

## Input

Create a `links.txt` file containing one URL per line.

Example:

```text
https://cartoony.net/...
https://carateen.tv/...
```

Lines starting with `#` are ignored.

## Output

The scraper generates an `output.sql` file containing SQL statements for:

- `public.media`
- `public.series`
- `public.episodes`

## Project Structure

```
.
├── links.txt
├── output.sql
├── scraper.js
├── package.json
└── README.md
```

## License

Part of the **ZiroTube** project.
````
