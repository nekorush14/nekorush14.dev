/**
 * Pre-build script to transform standalone URLs in Markdown files into link cards.
 * This script runs before the build and modifies Markdown files in place.
 * After the build, use `git restore` to revert the changes.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const CONTENT_DIR = join(projectRoot, 'src/content/blog');
const CACHE_FILE = join(projectRoot, '.ogp-cache.json');

/**
 * @typedef {Object} OgpData
 * @property {string} url
 * @property {string} title
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [siteName]
 * @property {string} [favicon]
 * @property {number} fetchedAt
 */

/** @type {Map<string, OgpData>} */
const cache = new Map();

/**
 * Load cache from disk
 */
async function loadCache() {
  try {
    await access(CACHE_FILE);
    const data = JSON.parse(await readFile(CACHE_FILE, 'utf-8'));
    for (const [key, value] of Object.entries(data)) {
      cache.set(key, value);
    }
    console.log(`Loaded ${cache.size} cached OGP entries`);
  } catch {
    console.log('No existing OGP cache found');
  }
}

/**
 * Save cache to disk
 */
async function saveCache() {
  const data = Object.fromEntries(cache.entries());
  await writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
}

/**
 * Decode HTML entities
 * @param {string} str
 * @returns {string}
 */
function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Extract title from HTML
 * @param {string} html
 * @returns {string}
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeHtmlEntities(match[1]) : '';
}

/**
 * Extract OGP metadata from HTML
 * @param {string} html
 * @param {string} url
 * @returns {OgpData}
 */
function parseOgpFromHtml(html, url) {
  const result = {
    url,
    title: '',
    description: '',
    image: '',
    siteName: '',
    favicon: '',
    fetchedAt: Date.now(),
  };

  const getMetaContent = (nameOrProperty) => {
    const patterns = [
      new RegExp(
        `<meta[^>]*(?:property|name)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
        'i'
      ),
      new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${nameOrProperty}["']`,
        'i'
      ),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decodeHtmlEntities(match[1]);
    }
    return '';
  };

  result.title =
    getMetaContent('og:title') ||
    getMetaContent('twitter:title') ||
    extractTitle(html);
  result.description =
    getMetaContent('og:description') ||
    getMetaContent('twitter:description') ||
    getMetaContent('description');
  result.image = getMetaContent('og:image') || getMetaContent('twitter:image');
  result.siteName =
    getMetaContent('og:site_name') || new URL(url).hostname;

  // Extract favicon
  const faviconMatch = html.match(
    /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i
  );
  if (faviconMatch) {
    try {
      result.favicon = new URL(faviconMatch[1], url).href;
    } catch {
      result.favicon = faviconMatch[1];
    }
  } else {
    result.favicon = new URL('/favicon.ico', url).href;
  }

  // Resolve relative image URLs
  if (result.image && !result.image.startsWith('http')) {
    try {
      result.image = new URL(result.image, url).href;
    } catch {
      // Keep as-is
    }
  }

  return result;
}

/**
 * Fetch OGP metadata from a URL
 * @param {string} url
 * @returns {Promise<OgpData>}
 */
async function fetchOgp(url) {
  // Check cache (valid for 24 hours)
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < 86400000) {
    return cached;
  }

  console.log(`  Fetching OGP: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; OGPFetcher/1.0; +https://nekorush14.dev)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`  Failed to fetch ${url}: ${response.status}`);
      return createFallbackOgp(url);
    }

    const html = await response.text();
    const ogpData = parseOgpFromHtml(html, url);

    cache.set(url, ogpData);
    return ogpData;
  } catch (error) {
    console.warn(`  Error fetching ${url}:`, error.message);
    return createFallbackOgp(url);
  }
}

/**
 * Create fallback OGP data
 * @param {string} url
 * @returns {OgpData}
 */
function createFallbackOgp(url) {
  const hostname = new URL(url).hostname;
  return {
    url,
    title: hostname,
    description: '',
    image: '',
    siteName: hostname,
    favicon: new URL('/favicon.ico', url).href,
    fetchedAt: Date.now(),
  };
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate HTML for a link card
 * @param {OgpData} ogp
 * @returns {string}
 */
function generateLinkCardHtml(ogp) {
  const title = escapeHtml(ogp.title) || escapeHtml(new URL(ogp.url).hostname);
  const description = escapeHtml(ogp.description);
  const siteName =
    escapeHtml(ogp.siteName) || escapeHtml(new URL(ogp.url).hostname);
  const favicon = escapeHtml(ogp.favicon);
  const image = escapeHtml(ogp.image);
  const url = escapeHtml(ogp.url);

  return `<div class="link-card">
  <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-card-anchor">
    <div class="link-card-content">
      <div class="link-card-text">
        <span class="link-card-title">${title}</span>
        ${description ? `<span class="link-card-description">${description}</span>` : ''}
        <span class="link-card-meta">
          ${favicon ? `<img src="${favicon}" alt="" class="link-card-favicon" loading="lazy" decoding="async" width="16" height="16" onerror="this.style.display='none'">` : ''}
          <span class="link-card-site-name">${siteName}</span>
        </span>
      </div>
      ${image ? `<div class="link-card-image-container"><img src="${image}" alt="" class="link-card-image" loading="lazy" decoding="async"></div>` : ''}
    </div>
  </a>
</div>`;
}

/**
 * Extract standalone URLs from markdown content (excluding front-matter)
 * @param {string} content
 * @returns {string[]}
 */
function extractStandaloneUrls(content) {
  const urls = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let inFrontMatter = false;
  let frontMatterCount = 0;

  for (const line of lines) {
    // Track front-matter state (YAML between --- markers)
    if (line.trim() === '---') {
      frontMatterCount++;
      if (frontMatterCount === 1) {
        inFrontMatter = true;
        continue;
      } else if (frontMatterCount === 2) {
        inFrontMatter = false;
        continue;
      }
    }

    // Skip front-matter
    if (inFrontMatter) continue;

    // Track code block state
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip code blocks
    if (inCodeBlock) continue;

    const trimmed = line.trim();

    // Check if the entire line is just a URL
    if (trimmed.match(/^https?:\/\/[^\s<>\[\]()]+$/)) {
      urls.push(trimmed);
    }
  }

  return urls;
}

/**
 * Transform markdown content by replacing standalone URLs with link cards
 * Skips front-matter and code blocks
 * @param {string} content
 * @param {Map<string, OgpData>} ogpMap
 * @returns {string}
 */
function transformContent(content, ogpMap) {
  const lines = content.split('\n');
  const transformedLines = [];
  let inCodeBlock = false;
  let inFrontMatter = false;
  let frontMatterCount = 0;

  for (const line of lines) {
    // Track front-matter state (YAML between --- markers)
    if (line.trim() === '---') {
      frontMatterCount++;
      if (frontMatterCount === 1) {
        inFrontMatter = true;
        transformedLines.push(line);
        continue;
      } else if (frontMatterCount === 2) {
        inFrontMatter = false;
        transformedLines.push(line);
        continue;
      }
    }

    // Don't transform inside front-matter
    if (inFrontMatter) {
      transformedLines.push(line);
      continue;
    }

    // Track code block state
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      transformedLines.push(line);
      continue;
    }

    // Skip transformation inside code blocks
    if (inCodeBlock) {
      transformedLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Check if line is a standalone URL
    if (trimmed.match(/^https?:\/\/[^\s<>\[\]()]+$/)) {
      const ogp = ogpMap.get(trimmed);
      if (ogp) {
        // Replace URL with link card HTML
        transformedLines.push('');
        transformedLines.push(generateLinkCardHtml(ogp));
        transformedLines.push('');
        continue;
      }
    }

    transformedLines.push(line);
  }

  return transformedLines.join('\n');
}

/**
 * Process all markdown files
 */
async function processMarkdownFiles() {
  console.log('Pre-build: Transforming URLs to link cards...\n');

  await loadCache();

  // Check if content directory exists
  try {
    await access(CONTENT_DIR);
  } catch {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = await readdir(CONTENT_DIR);
  const mdFiles = files.filter((file) => file.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('No Markdown files found.');
    return;
  }

  let processedCount = 0;
  let urlCount = 0;

  for (const file of mdFiles) {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');

    // Extract standalone URLs
    const urls = extractStandaloneUrls(content);

    if (urls.length === 0) {
      continue;
    }

    console.log(`Processing ${file} (${urls.length} URLs):`);

    // Fetch OGP data for all URLs
    const ogpMap = new Map();
    for (const url of urls) {
      const ogpData = await fetchOgp(url);
      ogpMap.set(url, ogpData);
    }

    // Transform content
    const transformedContent = transformContent(content, ogpMap);

    // Write back to file
    await writeFile(filePath, transformedContent, 'utf-8');

    processedCount++;
    urlCount += urls.length;
    console.log(`  Transformed ${urls.length} URLs\n`);
  }

  // Save cache
  await saveCache();

  console.log(
    `Done! Processed ${processedCount} file(s) with ${urlCount} total URLs.`
  );
  console.log('\nRemember to run `git restore src/content/blog/` after build to revert changes.');
}

processMarkdownFiles().catch((error) => {
  console.error('Error processing Markdown files:', error);
  process.exit(1);
});
