'use strict';

/**
 * scraper.js — Puppeteer media scraper
 * Reads URLs from links.txt, scrapes media metadata,
 * deduplicates by title, and saves to output.json incrementally.
 *
 * Usage:
 *   node scraper.js [--visible] [--delay=2000] [--timeout=30000]
 *
 * Flags:
 *   --visible        Run browser in non-headless mode (useful for debugging)
 *   --delay=N        Wait N ms between requests (default: 1500)
 *   --timeout=N      Navigation/wait timeout in ms (default: 30000)
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');

// ─── CONFIG ────────────────────────────────────────────────────────────────────

const LINKS_FILE  = path.resolve(__dirname, 'links.txt');
const OUTPUT_FILE = path.resolve(__dirname, 'output.json');

const args = process.argv.slice(2);

const HEADLESS = !args.includes('--visible');

const DELAY = (function () {
    const flag = args.find(a => a.startsWith('--delay='));
    return flag ? parseInt(flag.split('=')[1], 10) : 1500;
})();

const TIMEOUT = (function () {
    const flag = args.find(a => a.startsWith('--timeout='));
    return flag ? parseInt(flag.split('=')[1], 10) : 30000;
})();

// ─── SELECTORS ─────────────────────────────────────────────────────────────────

const SEL = {
    title:      'h2.text-white.fw-bold.mb-1',
    playButton: 'button.play-icon-button',
    videoSrc:   'source[src]',
    poster:     'img.poster-image',
    banner:     'img.banner-image, img[alt*="banner"]',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Load existing records from output.json.
 * Returns an empty array if the file doesn't exist or is malformed.
 * @returns {{ id: number, title: string, video: string, poster: string, banner: string }[]}
 */
function loadExisting() {
    if (!fs.existsSync(OUTPUT_FILE)) return [];
    try {
        const raw = fs.readFileSync(OUTPUT_FILE, 'utf8').trim();
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn(`[WARN] Could not parse ${OUTPUT_FILE}: ${e.message}. Starting fresh.`);
        return [];
    }
}

/**
 * Persist the records array to output.json (pretty-printed).
 * @param {{ id: number, title: string, video: string, poster: string, banner: string }[]} records
 */
function saveRecords(records) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2), 'utf8');
}

/**
 * Read all non-empty, non-comment lines from links.txt.
 * @returns {Promise<string[]>}
 */
function readLinks() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(LINKS_FILE)) {
            return reject(new Error(`links.txt not found at: ${LINKS_FILE}`));
        }

        const lines = [];
        const rl = readline.createInterface({
            input: fs.createReadStream(LINKS_FILE),
            crlfDelay: Infinity,
        });

        rl.on('line', line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) lines.push(trimmed);
        });

        rl.on('close', () => resolve(lines));
        rl.on('error', reject);
    });
}

/**
 * Convert a potentially relative URL to an absolute URL using the page's origin.
 * Passthrough if already absolute.
 * @param {string} url
 * @param {string} origin  — e.g. "https://example.com"
 * @returns {string}
 */
function toAbsolute(url, origin) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return 'https:' + url;
    // Relative path
    return origin.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
}

/**
 * Sleep for N milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── CORE SCRAPE LOGIC ─────────────────────────────────────────────────────────

/**
 * Scrape a single URL.
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, video: string, poster: string, banner: string }>}
 */
async function scrapePage(browser, url) {
    const page = await browser.newPage();

    // Block images/fonts to speed up loads — comment out if poster/banner need network load
    await page.setRequestInterception(true);
    page.on('request', req => {
        const type = req.resourceType();
        if (type === 'font') {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: TIMEOUT });

        // ── Title ────────────────────────────────────────────────────────────────
        await page.waitForSelector(SEL.title, { timeout: TIMEOUT });
        const title = await page.$eval(SEL.title, el => el.textContent.trim());

        if (!title) throw new Error('Title element found but empty');

        // ── Poster & Banner (may not require play click) ─────────────────────────
        const origin = new URL(url).origin;

        const poster = await page.$eval(
            SEL.poster,
            (el, org) => {
                const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
                if (!src) return '';
                if (/^https?:\/\//i.test(src)) return src;
                if (src.startsWith('//')) return 'https:' + src;
                return org + '/' + src.replace(/^\//, '');
            },
            origin
        ).catch(() => '');

        const banner = await page.$eval(
            SEL.banner,
            (el, org) => {
                const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
                if (!src) return '';
                if (/^https?:\/\//i.test(src)) return src;
                if (src.startsWith('//')) return 'https:' + src;
                return org + '/' + src.replace(/^\//, '');
            },
            origin
        ).catch(() => '');

        // ── Click play, then wait for <source src> ────────────────────────────────
        await page.waitForSelector(SEL.playButton, { timeout: TIMEOUT });
        const playBtn = await page.$(SEL.playButton);
        if (!playBtn) throw new Error('Play button not found');

        await playBtn.click();

        // Wait up to TIMEOUT for a <source> element with a non-empty src to appear
        await page.waitForFunction(
            (sel) => {
                const el = document.querySelector(sel);
                return el && el.getAttribute('src') && el.getAttribute('src').trim() !== '';
            },
            { timeout: TIMEOUT },
            SEL.videoSrc
        );

        const rawVideoSrc = await page.$eval(SEL.videoSrc, el => el.getAttribute('src') || '');
        const video = toAbsolute(rawVideoSrc, origin);

        if (!video) throw new Error('Could not extract video URL');

        return { title, video, poster, banner };

    } finally {
        await page.close();
    }
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════');
    console.log('  ZiroTube — Puppeteer Media Scraper');
    console.log('═══════════════════════════════════════════');
    console.log(`  Links file : ${LINKS_FILE}`);
    console.log(`  Output file: ${OUTPUT_FILE}`);
    console.log(`  Headless   : ${HEADLESS}`);
    console.log(`  Delay      : ${DELAY}ms between requests`);
    console.log(`  Timeout    : ${TIMEOUT}ms`);
    console.log('───────────────────────────────────────────\n');

    // Load state
    let links;
    try {
        links = await readLinks();
    } catch (e) {
        console.error(`[ERROR] ${e.message}`);
        process.exit(1);
    }

    if (!links.length) {
        console.warn('[WARN] links.txt is empty. Nothing to do.');
        process.exit(0);
    }

    console.log(`[INFO] Found ${links.length} URL(s) to process.\n`);

    const records = loadExisting();
    console.log(`[INFO] Loaded ${records.length} existing record(s) from output.json.\n`);

    // Build title lookup for fast dedup (lowercase)
    const existingTitles = new Set(records.map(r => r.title.toLowerCase()));

    // Determine next ID
    const maxId = records.reduce((max, r) => Math.max(max, r.id || 0), 0);
    let nextId = maxId + 1;

    // Launch browser once; reuse across all URLs
    const browser = await puppeteer.launch({
        headless: HEADLESS ? 'new' : false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    });

    let succeeded = 0;
    let skipped   = 0;
    let failed    = 0;

    for (let i = 0; i < links.length; i++) {
        const url = links[i];
        const label = `[${i + 1}/${links.length}]`;

        console.log(`${label} → ${url}`);

        try {
            const data = await scrapePage(browser, url);

            // Deduplication check
            if (existingTitles.has(data.title.toLowerCase())) {
                console.log(`${label} ⤳  SKIP — title already exists: "${data.title}"\n`);
                skipped++;
                continue;
            }

            // Build record
            const record = {
                id:     nextId++,
                title:  data.title,
                video:  data.video,
                poster: data.poster,
                banner: data.banner,
            };

            // Append and immediately persist
            records.push(record);
            existingTitles.add(record.title.toLowerCase());
            saveRecords(records);

            console.log(`${label} ✓  Saved: "${record.title}" (id: ${record.id})`);
            console.log(`        video : ${record.video}`);
            if (record.poster) console.log(`        poster: ${record.poster}`);
            if (record.banner) console.log(`        banner: ${record.banner}`);
            console.log();

            succeeded++;

        } catch (err) {
            console.error(`${label} ✗  FAILED: ${err.message}\n`);
            failed++;
        }

        // Polite delay between requests (skip after the last URL)
        if (i < links.length - 1) await sleep(DELAY);
    }

    // Always close the browser
    await browser.close();

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('  Done.');
    console.log(`  ✓ Saved   : ${succeeded}`);
    console.log(`  ⤳ Skipped : ${skipped}`);
    console.log(`  ✗ Failed  : ${failed}`);
    console.log(`  Total in file: ${records.length}`);
    console.log('═══════════════════════════════════════════');
}

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});