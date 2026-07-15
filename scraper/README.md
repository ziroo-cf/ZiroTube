# Media Scraper

Scrapes title, video URL, poster, and banner from a list of URLs. Saves to `output.json` incrementally. Skips duplicates by title.

## Setup

```bash
npm install puppeteer
```

## Usage

Put one URL per line in `links.txt`, then:

```bash
node scraper.js
```

**Flags**

| Flag | Default | Description |
|------|---------|-------------|
| `--visible` | off | Show browser window |
| `--delay=N` | 1500 | ms between requests |
| `--timeout=N` | 30000 | ms per page |

## Output

`output.json`:
```json
[
  {
    "id": 1,
    "title": "...",
    "video": "...",
    "poster": "...",
    "banner": "..."
  }
]
```

- IDs auto-increment from the highest existing ID.
- Lines starting with `#` in `links.txt` are ignored.
- A failed URL is logged and skipped; the run continues.