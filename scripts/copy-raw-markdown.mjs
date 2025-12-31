/**
 * Post-build script to copy raw Markdown files for static delivery.
 * This enables serving raw Markdown at /blog/{slug}.md URLs.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fm from 'front-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const CONTENT_DIR = join(projectRoot, 'src/content/blog');
const OUTPUT_DIR = join(projectRoot, 'dist/analog/public/blog');

async function copyRawMarkdownFiles() {
  console.log('Copying raw Markdown files for static delivery...');

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

    for (const file of mdFiles) {
      const filePath = join(CONTENT_DIR, file);
      const content = await readFile(filePath, 'utf-8');

      // Parse front matter to extract slug
      const parsed = fm(content);
      const slug = parsed.attributes.slug;

      if (!slug) {
        console.warn(`  Skipping ${file}: no slug found in front matter`);
        continue;
      }

      // Write raw Markdown to output directory
      const outputPath = join(OUTPUT_DIR, `${slug}.md`);
      await writeFile(outputPath, content, 'utf-8');

      console.log(`  Copied: ${file} -> ${slug}.md`);
      copiedCount++;
    }

    console.log(`Done! Copied ${copiedCount} Markdown file(s).`);
  } catch (error) {
    console.error('Error copying Markdown files:', error);
    process.exit(1);
  }
}

copyRawMarkdownFiles();
