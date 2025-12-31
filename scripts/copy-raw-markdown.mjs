/**
 * Post-build script to copy raw Markdown files for static delivery.
 * This enables serving raw Markdown at /blog/{slug}.md URLs.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fm from 'front-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const CONTENT_DIR = join(projectRoot, 'src/content/blog');
const OUTPUT_DIR = join(projectRoot, 'dist/analog/public/blog');

/**
 * Validates that the parsed attributes object has the expected structure.
 * @param {unknown} attributes - The parsed front matter attributes
 * @returns {{ valid: boolean; slug?: string; errors: string[] }}
 */
function validateAttributes(attributes) {
  const errors = [];

  // Check if attributes is an object
  if (typeof attributes !== 'object' || attributes === null) {
    errors.push('Front matter attributes must be an object');
    return { valid: false, errors };
  }

  const attrs = /** @type {Record<string, unknown>} */ (attributes);

  // Check for slug
  if (!('slug' in attrs)) {
    errors.push('Missing required field: slug');
    return { valid: false, errors };
  }

  if (typeof attrs.slug !== 'string') {
    errors.push(`Field 'slug' must be a string, got ${typeof attrs.slug}`);
    return { valid: false, errors };
  }

  if (attrs.slug.trim() === '') {
    errors.push("Field 'slug' cannot be empty");
    return { valid: false, errors };
  }

  // Validate slug format (alphanumeric, hyphens, underscores)
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugPattern.test(attrs.slug)) {
    errors.push(
      `Field 'slug' has invalid format: '${attrs.slug}'. Expected lowercase alphanumeric with hyphens.`
    );
    // Warning only, don't fail validation
  }

  return { valid: true, slug: attrs.slug, errors };
}

/**
 * Checks if a directory exists.
 * @param {string} path - The path to check
 * @returns {Promise<boolean>}
 */
async function directoryExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyRawMarkdownFiles() {
  console.log('Copying raw Markdown files for static delivery...');

  // Verify content directory exists
  if (!(await directoryExists(CONTENT_DIR))) {
    console.error(`Error: Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  // Verify dist directory exists (build should have created it)
  const distDir = join(projectRoot, 'dist/analog/public');
  if (!(await directoryExists(distDir))) {
    console.error(`Error: Build output directory not found: ${distDir}`);
    console.error('Make sure the build completed successfully before running this script.');
    process.exit(1);
  }

  try {
    const files = await readdir(CONTENT_DIR);
    const mdFiles = files.filter((file) => file.endsWith('.md'));

    if (mdFiles.length === 0) {
      console.log('No Markdown files found.');
      return;
    }

    // Ensure output directory exists
    await mkdir(OUTPUT_DIR, { recursive: true });

    let copiedCount = 0;
    let skippedCount = 0;

    for (const file of mdFiles) {
      const filePath = join(CONTENT_DIR, file);
      const content = await readFile(filePath, 'utf-8');

      // Parse front matter to extract slug with runtime validation
      const parsed = fm(content);
      const validation = validateAttributes(parsed.attributes);

      if (!validation.valid) {
        console.warn(`  Skipping ${file}:`);
        validation.errors.forEach((err) => console.warn(`    - ${err}`));
        skippedCount++;
        continue;
      }

      // Log warnings if any
      if (validation.errors.length > 0) {
        console.warn(`  Warning for ${file}:`);
        validation.errors.forEach((err) => console.warn(`    - ${err}`));
      }

      const slug = validation.slug;

      // Write raw Markdown to output directory
      const outputPath = join(OUTPUT_DIR, `${slug}.md`);
      await writeFile(outputPath, content, 'utf-8');

      console.log(`  Copied: ${file} -> ${slug}.md`);
      copiedCount++;
    }

    console.log(`Done! Copied ${copiedCount} Markdown file(s).`);
    if (skippedCount > 0) {
      console.warn(`Skipped ${skippedCount} file(s) due to validation errors.`);
    }
  } catch (error) {
    console.error('Error copying Markdown files:', error);
    process.exit(1);
  }
}

copyRawMarkdownFiles();
