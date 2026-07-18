'use strict';

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

puppeteer.use(StealthPlugin());

// ─── Configuration ─────────────────────────────────────────────────────────────

const LINKS_FILE = path.resolve(__dirname, 'links.txt');
const OUTPUT_FILE = path.resolve(__dirname, 'output.sql');

const args = process.argv.slice(2);
const HEADLESS = !args.includes('--visible');

const DELAY_MS = (() => {
    const flag = args.find(a => a.startsWith('--delay='));
    return flag ? parseInt(flag.split('=')[1], 10) : 1500;
})();

const TIMEOUT_MS = (() => {
    const flag = args.find(a => a.startsWith('--timeout='));
    return flag ? parseInt(flag.split('=')[1], 10) : 30000;
})();

// ─── Selectors ─────────────────────────────────────────────────────────────────

const SEL = {
    title: 'h2.text-white.fw-bold',
    poster: 'img.poster-image',
    playButton: '.play-icon-button',
    videoSrc: 'video source[src]',
    episodeItem: 'a.episode-list-item',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const escapeSql = (str) => {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
};

/**
 * Reads non‑empty, non‑comment lines from links.txt.
 */
const readLinks = async () => {
    if (!fs.existsSync(LINKS_FILE)) {
        throw new Error(`links.txt not found at: ${LINKS_FILE}`);
    }
    const lines = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(LINKS_FILE),
        crlfDelay: Infinity,
    });
    for await (const line of rl) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            lines.push(trimmed);
        }
    }
    return lines;
};

/**
 * Loads existing titles from the output SQL file to avoid duplicates.
 */
const loadExistingTitles = () => {
    const titles = new Set();
    if (!fs.existsSync(OUTPUT_FILE)) return titles;

    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const movieRegex = /INTO public\.media.*?VALUES\s*\(\s*'([^']+)'/g;
    const seriesRegex = /INTO public\.series.*?VALUES\s*\([^,]+,\s*'([^']+)'/g;

    let match;
    while ((match = movieRegex.exec(content)) !== null) {
        titles.add(match[1].replace(/''/g, "'").toLowerCase());
    }
    while ((match = seriesRegex.exec(content)) !== null) {
        titles.add(match[1].replace(/''/g, "'").toLowerCase());
    }
    return titles;
};

/**
 * Waits for the video source to appear after clicking the play button.
 */
const getVideoUrl = async (page) => {
    await page.waitForSelector(SEL.playButton, { visible: true, timeout: TIMEOUT_MS });
    await sleep(1000);
    await page.click(SEL.playButton);

    await page.waitForFunction(
        (sel) => {
            const el = document.querySelector(sel);
            return el && el.getAttribute('src') && el.getAttribute('src').trim() !== '';
        },
        { timeout: TIMEOUT_MS },
        SEL.videoSrc
    );

    return await page.$eval(SEL.videoSrc, el => el.src);
};

// ─── Core Scraping ─────────────────────────────────────────────────────────────

/**
 * Scrapes a single URL, determines type (movie/series), and returns structured data.
 */
const scrapePage = async (browser, url) => {
    const page = await browser.newPage();

    // Block fonts to speed up loading
    await page.setRequestInterception(true);
    page.on('request', req => {
        if (req.resourceType() === 'font') req.abort();
        else req.continue();
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });
        await page.waitForSelector(SEL.title, { timeout: 20000 });

        const mediaTitle = await page.$eval(SEL.title, el => el.textContent.trim());
        const mediaThumbnail = await page.$eval(SEL.poster, el => el.src).catch(() => null);

        // Detect if series by looking for episode links
        const episodesLinks = await page.evaluate((sel) => {
            const links = Array.from(document.querySelectorAll(sel));
            return links.map(link => ({
                raw_title: link.querySelector('span.fw-light')?.innerText.trim() || '',
                page_url: link.href,
            }));
        }, SEL.episodeItem);

        if (episodesLinks.length === 0) {
            // ── Movie ──
            console.log('  > Detected Type: MOVIE');
            const videoUrl = await getVideoUrl(page);
            await page.close();
            return {
                type: 'MOVIE',
                title: mediaTitle,
                thumbnail_url: mediaThumbnail,
                video_url: videoUrl,
            };
        }

        // ── Series ──
        console.log(`  > Detected Type: SERIES (${episodesLinks.length} episodes)`);
        const seriesId = crypto.randomUUID();
        const episodes = [];

        for (let i = 0; i < episodesLinks.length; i++) {
            const ep = episodesLinks[i];
            let episodeNum = i + 1;
            const match = ep.raw_title.match(/\d+/);
            if (match) episodeNum = parseInt(match[0], 10);

            console.log(`    - Processing Episode ${episodeNum}...`);

            try {
                await page.goto(ep.page_url, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });
                const videoUrl = await getVideoUrl(page);

                // Retrieve episode‑specific thumbnail (if available)
                const thumbnail = await page.evaluate(() => {
                    const thumbEl = document.querySelector('media-poster img');
                    return thumbEl ? thumbEl.src : null;
                });

                episodes.push({
                    id: crypto.randomUUID(),
                    series_id: seriesId,
                    episode_number: episodeNum,
                    video_url: videoUrl,
                    thumbnail_url: thumbnail,
                });
                console.log(`      ✓ Episode ${episodeNum} fetched.`);
            } catch (err) {
                console.warn(`      ⚠️ Failed to fetch Ep ${episodeNum}. Saved as MANUAL_ENTRY_REQUIRED.`);
                episodes.push({
                    id: crypto.randomUUID(),
                    series_id: seriesId,
                    episode_number: episodeNum,
                    video_url: 'MANUAL_ENTRY_REQUIRED',
                    thumbnail_url: null,
                });
            }
        }

        await page.close();
        return {
            type: 'SERIES',
            series_id: seriesId,
            title: mediaTitle,
            thumbnail_url: mediaThumbnail,
            episodes,
        };
    } catch (err) {
        await page.close();
        throw err;
    }
};

// ─── Main ──────────────────────────────────────────────────────────────────────

const main = async () => {
    console.log('═══════════════════════════════════════════');
    console.log('  ZiroTube — Auto-Detect Media Scraper');
    console.log('═══════════════════════════════════════════');

    const links = await readLinks().catch(err => {
        console.error(`[ERROR] ${err.message}`);
        process.exit(1);
    });

    if (!links.length) {
        console.warn('[WARN] links.txt is empty. Nothing to do.');
        process.exit(0);
    }

    const existingTitles = loadExistingTitles();
    console.log(`[INFO] Loaded ${existingTitles.size} existing titles to prevent duplicates.\n`);

    const browser = await puppeteer.launch({
        headless: HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    let moviesCount = 0;
    let seriesCount = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < links.length; i++) {
        const url = links[i];
        console.log(`[${i + 1}/${links.length}] → ${url}`);

        try {
            const data = await scrapePage(browser, url);

            if (existingTitles.has(data.title.toLowerCase())) {
                console.log(`  ⤳ SKIP — title already exists: "${data.title}"\n`);
                skipped++;
                continue;
            }

            let sql = '';

            if (data.type === 'MOVIE') {
                sql +=
                    `INSERT INTO public.media (title, video_url, thumbnail_url, category) ` +
                    `VALUES (${escapeSql(data.title)}, ${escapeSql(data.video_url)}, ${escapeSql(data.thumbnail_url)}, 'kids_movies');\n`;
                moviesCount++;
                console.log(`  ✓ MOVIE Saved: "${data.title}"`);
            } else if (data.type === 'SERIES') {
                sql +=
                    `INSERT INTO public.series (id, title, thumbnail_url) ` +
                    `VALUES ('${data.series_id}', ${escapeSql(data.title)}, ${escapeSql(data.thumbnail_url)});\n`;

                for (const ep of data.episodes) {
                    sql +=
                        `INSERT INTO public.episodes (id, series_id, episode_number, video_url, thumbnail_url) ` +
                        `VALUES ('${ep.id}', '${ep.series_id}', ${ep.episode_number}, ${escapeSql(ep.video_url)}, ${escapeSql(ep.thumbnail_url)});\n`;
                }
                seriesCount++;
                console.log(`  ✓ SERIES Saved: "${data.title}" with ${data.episodes.length} episodes.`);
            }

            fs.appendFileSync(OUTPUT_FILE, sql + '\n', 'utf8');
            existingTitles.add(data.title.toLowerCase());
            console.log();
        } catch (err) {
            console.error(`  ✗ FAILED: ${err.message}\n`);
            failed++;
        }

        if (i < links.length - 1) await sleep(DELAY_MS);
    }

    await browser.close();

    console.log('═══════════════════════════════════════════');
    console.log('  Done.');
    console.log(`  ✓ Movies Saved : ${moviesCount}`);
    console.log(`  ✓ Series Saved : ${seriesCount}`);
    console.log(`  ⤳ Skipped      : ${skipped}`);
    console.log(`  ✗ Failed       : ${failed}`);
    console.log(`  📁 Output file : ${OUTPUT_FILE}`);
    console.log('═══════════════════════════════════════════');
};

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
