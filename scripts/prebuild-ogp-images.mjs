/**
 * Pre-build script to generate OGP images for blog posts.
 * Uses Satori for SVG generation and @resvg/resvg-js for PNG conversion.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const CONTENT_DIR = join(projectRoot, 'src/content/blog');
const OUTPUT_DIR = join(projectRoot, 'public/ogp/blog');
const BASE_SVG_PATH = join(projectRoot, 'src/assets/ogp/blog-ogp-base.svg');
const FONT_CACHE_DIR = join(projectRoot, '.font-cache');

// Layout configuration based on design spec
const LAYOUT = {
  width: 1200,
  height: 630,
  title: {
    x: 80,
    y: 180,
    maxWidth: 800,
    fontSize: 48,
    color: '#ffffff',
    maxLines: 3,
  },
  tags: {
    x: 80,
    y: 480,
    fontSize: 16,
    color: '#fca605',
  },
  date: {
    x: 80,
    y: 520,
    fontSize: 14,
    color: '#b1c9ee',
  },
  siteName: {
    x: 80,
    y: 560,
    fontSize: 18,
    color: '#a5a6f2',
    text: 'nekorush14.dev',
  },
};

/**
 * Fetch and cache font from Google Fonts
 * @param {string} fontFamily
 * @param {number} weight
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchFont(fontFamily, weight) {
  const cacheFileName = `${fontFamily.replace(/\s+/g, '-')}-${weight}.ttf`;
  const cachePath = join(FONT_CACHE_DIR, cacheFileName);

  // Check cache first
  try {
    await access(cachePath);
    const cached = await readFile(cachePath);
    // Verify it's not WOFF2 (starts with "wOF2")
    if (
      cached.length > 4 &&
      cached[0] === 0x77 &&
      cached[1] === 0x4f &&
      cached[2] === 0x46 &&
      cached[3] === 0x32
    ) {
      console.log(`  Cached font is WOFF2, re-fetching TTF...`);
    } else {
      console.log(`  Using cached font: ${cacheFileName}`);
      return cached.buffer;
    }
  } catch {
    // Cache miss, fetch from Google Fonts
  }

  console.log(`  Fetching font: ${fontFamily} (weight: ${weight})`);

  // Google Fonts CSS API - use old User-Agent to get TTF format
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weight}&display=swap`;

  const cssResponse = await fetch(cssUrl, {
    headers: {
      // Use old IE User-Agent to request TTF format instead of WOFF2
      'User-Agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
    },
  });

  if (!cssResponse.ok) {
    throw new Error(`Failed to fetch font CSS: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();

  // Extract font URL from CSS (look for truetype format)
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]truetype['"]\)/);
  if (!urlMatch) {
    // Fallback: try to find any URL
    const fallbackMatch = css.match(/src:\s*url\(([^)]+)\)/);
    if (!fallbackMatch) {
      throw new Error('Could not find font URL in CSS');
    }
    console.log('  Warning: Could not find TTF format, using fallback URL');
  }

  const fontUrl = urlMatch ? urlMatch[1] : css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!fontUrl) {
    throw new Error('Could not find font URL in CSS');
  }

  const fontResponse = await fetch(fontUrl);

  if (!fontResponse.ok) {
    throw new Error(`Failed to fetch font: ${fontResponse.status}`);
  }

  const fontData = await fontResponse.arrayBuffer();

  // Cache the font
  await mkdir(FONT_CACHE_DIR, { recursive: true });
  await writeFile(cachePath, Buffer.from(fontData));
  console.log(`  Cached font: ${cacheFileName}`);

  return fontData;
}

/**
 * Parse front-matter from markdown content
 * @param {string} content
 * @returns {{ attributes: Record<string, unknown>, body: string }}
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { attributes: {}, body: content };
  }

  const [, frontMatter, body] = match;
  const attributes = {};

  // Simple YAML parser for front-matter
  let currentKey = null;
  let inArray = false;
  const arrayValues = [];

  for (const line of frontMatter.split('\n')) {
    const trimmed = line.trim();

    if (inArray) {
      if (trimmed.startsWith('- ')) {
        arrayValues.push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
      } else if (trimmed && !trimmed.startsWith('-')) {
        // End of array
        attributes[currentKey] = arrayValues.slice();
        arrayValues.length = 0;
        inArray = false;
        // Process this line as a new key
      } else {
        continue;
      }
    }

    if (!inArray) {
      const keyMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        const [, key, value] = keyMatch;
        if (value === '') {
          // Possibly an array
          currentKey = key;
          inArray = true;
          arrayValues.length = 0;
        } else {
          attributes[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  // Handle trailing array
  if (inArray && arrayValues.length > 0) {
    attributes[currentKey] = arrayValues;
  }

  return { attributes, body };
}

/**
 * Create OGP image element structure for Satori
 * @param {string} baseSvgDataUrl
 * @param {Object} postData
 * @returns {Object}
 */
function createOgpElement(baseSvgDataUrl, postData) {
  const { title, tags, date } = postData;

  // Format tags as "#tag1  #tag2  #tag3"
  const formattedTags = tags?.length
    ? tags.map((tag) => `#${tag}`).join('  ')
    : '';

  return {
    type: 'div',
    props: {
      style: {
        width: LAYOUT.width,
        height: LAYOUT.height,
        display: 'flex',
        position: 'relative',
      },
      children: [
        // Background SVG
        {
          type: 'img',
          props: {
            src: baseSvgDataUrl,
            width: LAYOUT.width,
            height: LAYOUT.height,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
            },
          },
        },
        // Text overlay container
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: LAYOUT.width,
              height: LAYOUT.height,
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    left: LAYOUT.title.x,
                    top: LAYOUT.title.y,
                    width: LAYOUT.title.maxWidth,
                    fontSize: LAYOUT.title.fontSize,
                    fontWeight: 700,
                    color: LAYOUT.title.color,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: LAYOUT.title.maxLines,
                    WebkitBoxOrient: 'vertical',
                  },
                  children: title,
                },
              },
              // Tags
              formattedTags
                ? {
                    type: 'div',
                    props: {
                      style: {
                        position: 'absolute',
                        left: LAYOUT.tags.x,
                        top: LAYOUT.tags.y,
                        fontSize: LAYOUT.tags.fontSize,
                        color: LAYOUT.tags.color,
                      },
                      children: formattedTags,
                    },
                  }
                : null,
              // Date
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    left: LAYOUT.date.x,
                    top: LAYOUT.date.y,
                    fontSize: LAYOUT.date.fontSize,
                    color: LAYOUT.date.color,
                  },
                  children: date,
                },
              },
              // Site name
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    left: LAYOUT.siteName.x,
                    top: LAYOUT.siteName.y,
                    fontSize: LAYOUT.siteName.fontSize,
                    color: LAYOUT.siteName.color,
                  },
                  children: LAYOUT.siteName.text,
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}

/**
 * Generate OGP image for a blog post
 * @param {Object} postData
 * @param {string} baseSvgDataUrl
 * @param {ArrayBuffer} fontData
 * @returns {Promise<Buffer>}
 */
async function generateOgpImage(postData, baseSvgDataUrl, fontData) {
  const element = createOgpElement(baseSvgDataUrl, postData);

  const svg = await satori(element, {
    width: LAYOUT.width,
    height: LAYOUT.height,
    fonts: [
      {
        name: 'Noto Sans JP',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: LAYOUT.width,
    },
  });

  const pngData = resvg.render();
  return pngData.asPng();
}

/**
 * Main function to process all blog posts
 */
async function main() {
  console.log('Pre-build: Generating OGP images for blog posts...\n');

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Load base SVG
  let baseSvg;
  try {
    baseSvg = await readFile(BASE_SVG_PATH, 'utf-8');
  } catch {
    console.error(`Error: Base SVG not found at ${BASE_SVG_PATH}`);
    console.error(
      'Please ensure the base SVG is placed at src/assets/ogp/blog-ogp-base.svg'
    );
    process.exit(1);
  }

  // Convert base SVG to data URL
  const baseSvgDataUrl = `data:image/svg+xml;base64,${Buffer.from(baseSvg).toString('base64')}`;

  // Fetch font
  let fontData;
  try {
    fontData = await fetchFont('Noto Sans JP', 700);
  } catch (error) {
    console.error('Error fetching font:', error.message);
    process.exit(1);
  }

  // Read all markdown files
  let files;
  try {
    files = await readdir(CONTENT_DIR);
  } catch {
    console.error(`Error: Content directory not found at ${CONTENT_DIR}`);
    process.exit(1);
  }

  const mdFiles = files.filter((file) => file.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('No markdown files found.');
    return;
  }

  console.log(`Found ${mdFiles.length} blog post(s)\n`);

  let generatedCount = 0;

  for (const file of mdFiles) {
    const filePath = join(CONTENT_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const { attributes } = parseFrontMatter(content);

    const { title, slug, date, tags } = attributes;

    if (!title || !slug) {
      console.log(`  Skipping ${file}: missing title or slug`);
      continue;
    }

    console.log(`  Generating: ${slug}.png`);

    try {
      const pngBuffer = await generateOgpImage(
        { title, tags, date },
        baseSvgDataUrl,
        fontData
      );

      const outputPath = join(OUTPUT_DIR, `${slug}.png`);
      await writeFile(outputPath, pngBuffer);
      generatedCount++;
    } catch (error) {
      console.error(`  Error generating ${slug}.png:`, error.message);
    }
  }

  console.log(`\nDone! Generated ${generatedCount} OGP image(s).`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
