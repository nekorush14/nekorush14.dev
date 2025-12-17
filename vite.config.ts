/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog, { type PrerenderContentFile } from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      content: {
        highlighter: 'shiki',
        shikiOptions: {
          highlight: {
            // Use tokyo-night theme for both light and dark modes
            theme: 'tokyo-night',
            // Add data-language attribute to pre element
            transformers: [
              {
                name: 'add-language-attribute',
                pre(node) {
                  // Add data-language attribute with the language name
                  node.properties['data-language'] = this.options.lang || 'code';
                },
              },
            ],
          },
          highlighter: {
            // Add tokyo-night theme
            additionalThemes: ['tokyo-night'],
          },
        },
      },
      prerender: {
        routes: async () => [
          '/',
          '/blog',
          {
            contentDir: 'src/content/blog',
            transform: (file: PrerenderContentFile) => `/blog/${file.attributes['slug']}`,
          },
        ],
      },
      ssr: true,
    }),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
}));
